from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import uuid
import os
import shutil
from pathlib import Path

from app.config import settings
from app.schemas import (
    HealthResponse,
    DocumentIngestResponse,
    DocumentListResponse,
    AskRequest,
    AskResponse,
    ErrorResponse,
    DocumentStatus,
)
from app.services.ingestion import process_document, IngestionError
from app.services.vector_store import get_vector_store, VectorStoreError
from app.schemas import Chunk
from typing import List


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

    return HealthResponse(status='ok' if healthy else 'degraded')


@app.post('/documents/ingest', response_model=DocumentIngestResponse)
async def ingest_document(file: UploadFile = File(...)):
    # Validate file type
    allowed_types = ['application/pdf', 'text/markdown', 'text/plain', 'text/x-markdown']
    if file.content_type not in allowed_types:
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

    # Compute content hash for duplicate detection
    content_hash = hashlib.sha256(content).hexdigest()

    # Generate document ID
    document_id = str(uuid.uuid4())

    # Save file temporarily in uploads directory
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    temp_path = upload_dir / f'{document_id}_{file.filename}'

    try:
        temp_path.write_bytes(content)

        # Process document: extract -> chunk
        result = await process_document(temp_path, file.filename, file.content_type, document_id)

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
            upserted_count = vector_store.upsert_chunks(result['chunks'])
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

            if doc_id not in doc_map:
                doc_map[doc_id] = {
                    'document_id': doc_id,
                    'filename': payload.get('filename', 'unknown'),
                    'content_hash': payload.get('content_hash', ''),
                    'uploaded_at': '',  # Not stored currently
                    'status': DocumentStatus.READY,
                    'chunk_count': 0,
                }
            doc_map[doc_id]['chunk_count'] += 1

        documents = [
            {
                'document_id': doc['document_id'],
                'filename': doc['filename'],
                'content_hash': doc['content_hash'],
                'uploaded_at': doc['uploaded_at'] or '2024-01-01T00:00:00Z',
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


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)