from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import hashlib
import re
import zipfile
from pathlib import Path

from app.config import settings
from app.schemas import (
    HealthResponse,
    DocumentIngestResponse,
    DocumentListResponse,
    AskRequest,
    AskResponse,
    DocumentStatus,
)
from app.services.ingestion import process_document, IngestionError
from app.services.vector_store import get_vector_store, VectorStoreError
from app.services.retrieval import retrieve_chunks
from app.services.generation import generate_answer, GenerationError


app = FastAPI(
    title='DocuMind AI Service',
    description='Document ingestion, retrieval, and grounded generation',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


app.middleware('http')
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers['X-Request-ID'] = request_id
    return response


@app.exception_handler(IngestionError)
async def ingestion_error_handler(request: Request, exc: IngestionError):
    return JSONResponse(
        status_code=400,
        content={
            'error': {
                'code': 'INGESTION_FAILED',
                'message': str(exc),
            },
            'request_id': getattr(request.state, 'request_id', None),
        },
    )


@app.exception_handler(VectorStoreError)
async def vector_store_error_handler(request: Request, exc: VectorStoreError):
    return JSONResponse(
        status_code=502,
        content={
            'error': {
                'code': 'RETRIEVAL_FAILED',
                'message': str(exc),
            },
            'request_id': getattr(request.state, 'request_id', None),
        },
    )


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request: Request, exc: RuntimeError):
    return JSONResponse(
        status_code=500,
        content={
            'error': {
                'code': 'INGESTION_FAILED',
                'message': 'Unexpected ingestion error',
            },
            'request_id': getattr(request.state, 'request_id', None),
        },
    )


@app.get('/health', response_model=HealthResponse)
async def health_check():
    vector_store = get_vector_store()
    healthy = vector_store.health_check()
    from app.services.generation import get_llm_provider, OpenRouterProvider, OpenAIProvider
    from app.services.embeddings import get_embedding_provider

    llm = get_llm_provider()
    emb = get_embedding_provider()

    if isinstance(llm, OpenRouterProvider):
        llm_label = f"OpenRouter ({llm.model_name})"
    elif isinstance(llm, OpenAIProvider):
        llm_label = f"OpenAI ({llm.model_name})"
    else:
        llm_label = "MockLLMProvider (Offline Fallback)"

    return HealthResponse(
        status='ok' if healthy else 'degraded',
        vector_store='connected' if healthy else 'disconnected',
        llm_provider=llm_label,
        embedding_model=emb.model_name,
    )


@app.get('/v1/models')
async def list_models():
    """Dummy endpoint to prevent 404s from OpenAI-compatible client probes."""
    return {
        'object': 'list',
        'data': [
            {'id': settings.LLM_MODEL, 'object': 'model', 'owned_by': 'openrouter'},
            {'id': settings.EMBEDDING_MODEL, 'object': 'model', 'owned_by': 'openai'},
        ]
    }


@app.post('/documents/ingest', response_model=DocumentIngestResponse)
async def ingest_document(file: UploadFile = File(...)):
    # Validate file type
    allowed_types = [
        'application/pdf',
        'text/markdown',
        'text/plain',
        'text/x-markdown',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/docx',
        'application/msword',
    ]
    original_filename = file.filename or ''
    filename = Path(original_filename).name
    filename = re.sub(r'[^A-Za-z0-9._ -]', '_', filename).strip()
    filename_lower = filename.lower()
    if not filename:
        raise HTTPException(status_code=400, detail={'error': {'code': 'INVALID_FILENAME', 'message': 'Filename is required'}})
    is_valid_type = file.content_type in allowed_types or filename_lower.endswith(('.pdf', '.md', '.markdown', '.txt', '.docx'))

    if not is_valid_type:
        raise HTTPException(
            status_code=400,
            detail={
                'error': {
                    'code': 'UNSUPPORTED_FILE_TYPE',
                    'message': f'Unsupported file type: {file.content_type}',
                }
            },
        )

    # Read file content
    content = await file.read()

    # Validate file size
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail={
                'error': {
                    'code': 'FILE_TOO_LARGE',
                    'message': f'File size exceeds maximum of {settings.MAX_UPLOAD_MB}MB',
                }
            },
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                'error': {
                    'code': 'INGESTION_FAILED',
                    'message': 'File is empty',
                }
            },
        )

    suffix = Path(filename).suffix.lower()
    if suffix == '.pdf' and not content.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail={'error': {'code': 'INVALID_FILE_CONTENT', 'message': 'File is not a valid PDF'}})
    if suffix == '.docx' and not zipfile.is_zipfile(__import__('io').BytesIO(content)):
        raise HTTPException(status_code=400, detail={'error': {'code': 'INVALID_FILE_CONTENT', 'message': 'File is not a valid DOCX'}})

    # Compute content hash for duplicate detection
    content_hash = hashlib.sha256(content).hexdigest()

    # Check if this content already exists in Qdrant
    vector_store = get_vector_store()
    existing_document = vector_store.find_document_by_content_hash(content_hash)
    if existing_document:
        return JSONResponse(
            status_code=200,
            content={
                'document_id': existing_document['document_id'],
                'filename': existing_document['filename'],
                'status': 'ready',
                'chunk_count': existing_document['chunk_count'],
                'duplicate': True
            },
        )

    # Generate document ID
    document_id = str(uuid.uuid4())

    # Save file temporarily in uploads directory
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    temp_path = upload_dir / f'{document_id}_{filename}'

    try:
        temp_path.write_bytes(content)

        # Process document: extract -> chunk
        result = await process_document(temp_path, filename, file.content_type, document_id)

        if result['status'] == 'failed':
            # Clean up temp file on failure
            try:
                if temp_path.exists():
                    temp_path.unlink()
            except Exception:
                pass
            raise HTTPException(
                status_code=500,
                detail={
                    'error': {
                        'code': 'INGESTION_FAILED',
                        'message': result['error_message'],
                    }
                },
            )

        # Upsert chunks to Qdrant
        vector_store = get_vector_store()
        if result['chunks']:
            upserted_count = await vector_store.upsert_chunks(result['chunks'])
        else:
            upserted_count = 0

        # Return ready status with chunk count
        return DocumentIngestResponse(
            document_id=document_id,
            filename=result['filename'],
            status=DocumentStatus.READY,
            chunk_count=upserted_count,
            error_message=result['error_message'],
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up on unexpected error
        try:
            vector_store.delete_by_document_id(document_id)
        except Exception:
            pass
        try:
            if temp_path.exists():
                temp_path.unlink()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail={
                'error': {
                    'code': 'INGESTION_FAILED',
                    'message': f'Unexpected error during ingestion: {str(e)}',
                }
            },
        )

    finally:
        # Clean up temp file if still exists
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass


@app.get('/documents', response_model=DocumentListResponse)
async def list_documents():
    vector_store = get_vector_store()

    try:
        # Scroll through all points to aggregate by document_id
        all_points = []
        offset = None
        limit = 100

        while True:
            result = vector_store.client.scroll(
                collection_name=settings.QDRANT_COLLECTION,
                limit=limit,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            points, next_offset = result
            all_points.extend(points)
            if next_offset is None:
                break
            offset = next_offset

        # Aggregate by document_id
        doc_map = {}
        for point in all_points:
            payload = point.payload
            doc_id = payload.get('document_id')
            if not doc_id:
                continue

            fn = payload.get('filename', 'unknown')
            mime = 'text/plain'
            if fn.endswith('.pdf'):
                mime = 'application/pdf'
            elif fn.endswith('.md'):
                mime = 'text/markdown'

            if doc_id not in doc_map:
                doc_map[doc_id] = {
                    'document_id': doc_id,
                    'filename': fn,
                    'mime_type': mime,
                    'content_hash': payload.get('content_hash', ''),
                    'uploaded_at': '2024-01-01T00:00:00Z',
                    'status': DocumentStatus.READY,
                    'chunk_count': 0,
                }
            doc_map[doc_id]['chunk_count'] += 1

        documents = [
            {
                'document_id': doc['document_id'],
                'filename': doc['filename'],
                'mime_type': doc['mime_type'],
                'content_hash': doc['content_hash'],
                'uploaded_at': doc['uploaded_at'],
                'status': doc['status'],
                'chunk_count': doc['chunk_count'],
            }
            for doc in doc_map.values()
        ]

        return DocumentListResponse(documents=documents)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                'error': {
                    'code': 'RETRIEVAL_FAILED',
                    'message': f'Failed to list documents: {str(e)}',
                }
            },
        )


@app.delete('/documents/{document_id}')
async def delete_document(document_id: str):
    vector_store = get_vector_store()

    try:
        deleted_count = vector_store.delete_by_document_id(document_id)

        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail={
                    'error': {
                        'code': 'DOCUMENT_NOT_FOUND',
                        'message': f'Document not found: {document_id}',
                    }
                },
            )

        # Also clean up uploaded file if exists
        upload_dir = Path(settings.UPLOAD_DIR)
        for file_path in upload_dir.glob(f'{document_id}_*'):
            file_path.unlink()

        return JSONResponse(status_code=204, content=None)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                'error': {
                    'code': 'INGESTION_FAILED',
                    'message': f'Failed to delete document: {str(e)}',
                }
            },
        )


@app.post('/ask', response_model=AskResponse)
async def ask_question(body: AskRequest):
    try:
        retrieved = await retrieve_chunks(
            body.question,
            document_id=body.document_id,
            document_ids=body.document_ids,
        )
        answer, status, sources, context = await generate_answer(
            body.question, 
            retrieved,
            conversation_history=body.conversation_history  # Pass conversation history
        )
        return AskResponse(
            answer=answer,
            status=status,
            sources=sources,
            retrieval_context=context,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={
                'error': {
                    'code': 'MODEL_PROVIDER_ERROR' if isinstance(e, GenerationError) else 'RETRIEVAL_FAILED',
                    'message': str(e),
                }
            },
        )


@app.get('/documents/{document_id}/suggestions')
async def get_document_suggestions(document_id: str):
    vector_store = get_vector_store()
    chunks = vector_store.get_chunks_by_document_id(document_id, limit=6)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail={'error': {'code': 'DOCUMENT_NOT_FOUND', 'message': f'Document {document_id} not found'}},
        )

    filename = chunks[0].get('filename', 'document')
    combined_text = "\n\n".join(c.get('text', '')[:700] for c in chunks[:4])

    from app.services.generation import get_llm_provider
    llm = get_llm_provider()
    suggestions = await llm.generate_document_suggestions(filename, combined_text)

    return {
        'document_id': document_id,
        'filename': filename,
        'suggestions': suggestions,
    }


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)