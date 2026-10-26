from typing import Optional, List
import math
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    CollectionInfo,
)
from qdrant_client.http.exceptions import UnexpectedResponse

from app.config import settings
from app.schemas import Chunk
from app.services.embeddings import get_embedding_provider


class VectorStoreError(Exception):
    pass


class VectorStore:
    def __init__(self):
        self.client: Optional[QdrantClient] = None
        self.collection_name = settings.QDRANT_COLLECTION
        self.embedding_provider = get_embedding_provider()

    def connect(self) -> None:
        """Initialize Qdrant client and ensure collection exists."""
        if self.client is not None:
            return

        import logging
        try:
            if settings.QDRANT_URL == ':memory:':
                self.client = QdrantClient(location=':memory:')
                logging.info('Using in-memory Qdrant (volatile storage)')
            elif settings.QDRANT_URL.startswith('http://') or settings.QDRANT_URL.startswith('https://'):
                # Remote Qdrant (cloud or server)
                if settings.QDRANT_API_KEY:
                    self.client = QdrantClient(
                        url=settings.QDRANT_URL,
                        api_key=settings.QDRANT_API_KEY,
                        timeout=3.0,
                    )
                else:
                    self.client = QdrantClient(url=settings.QDRANT_URL, timeout=3.0)
                logging.info(f'Connected to remote Qdrant at {settings.QDRANT_URL}')
            else:
                # Local disk persistence
                from pathlib import Path
                Path(settings.QDRANT_URL).mkdir(parents=True, exist_ok=True)
                self.client = QdrantClient(path=settings.QDRANT_URL)
                logging.info(f'Using local persistent Qdrant at {settings.QDRANT_URL}')

            self._ensure_collection()
        except Exception as e:
            self.client = None
            raise VectorStoreError(f'Failed to initialize configured Qdrant: {e}') from e

    def _ensure_collection(self) -> None:
        """Create collection if it doesn't exist, or validate existing one."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        try:
            collection_info: CollectionInfo = self.client.get_collection(self.collection_name)
            existing_dim = collection_info.config.params.vectors.size
            expected_dim = self.embedding_provider.dimension

            if existing_dim != expected_dim:
                raise VectorStoreError(
                    f'Collection dimension mismatch: expected {expected_dim}, got {existing_dim}. '
                    f'Recreate collection or use matching embedding model.'
                )
            self._ensure_payload_indexes()
        except UnexpectedResponse as e:
            if e.status_code == 404:
                self._create_collection()
            else:
                raise VectorStoreError(f'Error checking collection: {e}')
        except Exception as e:
            if 'not found' in str(e).lower() or "doesn't exist" in str(e).lower():
                self._create_collection()
            else:
                raise VectorStoreError(f'Error checking collection: {e}')

    def _create_collection(self) -> None:
        """Create the Qdrant collection with proper configuration."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        dimension = self.embedding_provider.dimension

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=dimension,
                distance=Distance.COSINE,
            ),
        )

        self._ensure_payload_indexes()

    def _ensure_payload_indexes(self) -> None:
        """Ensure filters used by the application are indexed on existing collections too."""
        if self.client is None:
            raise VectorStoreError('Client not connected')
        for field in ['document_id', 'filename', 'content_hash', 'document_content_hash']:
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema='keyword',
                )
            except Exception as e:
                raise VectorStoreError(f'Failed to create payload index for {field}: {e}') from e

    async def upsert_chunks(self, chunks: List[Chunk]) -> int:
        """Upsert chunks into Qdrant. Returns count of upserted points."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        if not chunks:
            return 0

        points = []
        batch_size = max(1, settings.EMBEDDING_BATCH_SIZE)
        for batch_start in range(0, len(chunks), batch_size):
            batch = chunks[batch_start:batch_start + batch_size]
            texts = [chunk['text'] if isinstance(chunk, dict) else chunk.text for chunk in batch]
            embeddings = await self.embedding_provider.embed_texts(texts)
            if len(embeddings) != len(batch):
                raise VectorStoreError(
                    f'Embedding count mismatch: expected {len(batch)}, got {len(embeddings)}'
                )

            for chunk, embedding in zip(batch, embeddings):
                if len(embedding) != self.embedding_provider.dimension:
                    raise VectorStoreError(
                        f'Embedding dimension mismatch: expected {self.embedding_provider.dimension}, got {len(embedding)}'
                    )
                if not all(math.isfinite(value) for value in embedding):
                    raise VectorStoreError('Embedding contains non-finite values')
                if isinstance(chunk, dict):
                    text = chunk.get('text', '')
                    doc_id = chunk.get('document_id')
                    fn = chunk.get('filename')
                    c_idx = chunk.get('chunk_index', 0)
                    c_hash = chunk.get('content_hash')
                    doc_hash = chunk.get('document_content_hash')
                    page_no = chunk.get('page_number')
                    sec_title = chunk.get('section_title')
                    start_c = chunk.get('start_char')
                    end_c = chunk.get('end_char')
                else:
                    text = chunk.text
                    doc_id = chunk.metadata.document_id
                    fn = chunk.metadata.filename
                    c_idx = chunk.metadata.chunk_index
                    c_hash = chunk.metadata.content_hash
                    doc_hash = getattr(chunk.metadata, 'document_content_hash', None)
                    page_no = chunk.metadata.page_number
                    sec_title = chunk.metadata.section_title
                    start_c = chunk.metadata.start_char
                    end_c = chunk.metadata.end_char

                payload = {
                    'document_id': doc_id,
                    'filename': fn,
                    'chunk_index': c_idx,
                    'text': text,
                    'content_hash': c_hash,
                    'document_content_hash': doc_hash,
                    'embedding_model': self.embedding_provider.model_name,
                }
                if page_no is not None:
                    payload['page_number'] = page_no
                if sec_title is not None:
                    payload['section_title'] = sec_title
                if start_c is not None:
                    payload['start_char'] = start_c
                if end_c is not None:
                    payload['end_char'] = end_c

                point_id = str(uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f'{doc_id}:{c_idx}:{doc_hash or c_hash}',
                ))

                points.append(PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload,
                ))

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

        return len(points)

    def delete_by_document_id(self, document_id: str) -> int:
        """Delete all chunks for a document. Returns count of deleted points."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        filter_doc = Filter(
            must=[
                FieldCondition(
                    key='document_id',
                    match=MatchValue(value=document_id),
                )
            ]
        )

        try:
            count = 0
            offset = None
            while True:
                matching, offset = self.client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=filter_doc,
                    limit=1000,
                    offset=offset,
                    with_payload=False,
                    with_vectors=False,
                )
                count += len(matching)
                if offset is None:
                    break
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=filter_doc,
            )
            return count
        except Exception as error:
            raise VectorStoreError(f'Failed to delete document {document_id}: {error}') from error

    def find_document_by_content_hash(self, content_hash: str) -> Optional[dict]:
        """Find a complete document using its original file hash."""
        if self.client is None:
            raise VectorStoreError('Client not connected')
        query_filter = Filter(
            must=[
                FieldCondition(
                    key='document_content_hash',
                    match=MatchValue(value=content_hash),
                )
            ]
        )
        points, _ = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=query_filter,
            limit=1,
            with_payload=True,
            with_vectors=False,
        )
        if not points or not points[0].payload:
            return None
        payload = points[0].payload
        document_id = payload.get('document_id')
        if not document_id:
            return None

        count = 0
        offset = None
        while True:
            page, offset = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key='document_id',
                            match=MatchValue(value=document_id),
                        )
                    ]
                ),
                limit=1000,
                offset=offset,
                with_payload=False,
                with_vectors=False,
            )
            count += len(page)
            if offset is None:
                break
        return {
            'document_id': document_id,
            'filename': payload.get('filename', 'unknown'),
            'chunk_count': count,
        }

    def search(
        self,
        query_vector: List[float],
        top_k: int = None,
        document_id: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
    ) -> List[dict]:
        """Search for similar chunks. Returns list of scored points with payload."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        if top_k is None:
            top_k = settings.TOP_K

        query_filter = None
        selected_ids = document_ids or ([document_id] if document_id else [])
        if selected_ids:
            query_filter = Filter(
                should=[
                    FieldCondition(
                        key='document_id',
                        match=MatchValue(value=selected_id),
                    )
                    for selected_id in selected_ids
                ]
            )

        if hasattr(self.client, 'query_points'):
            res = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=top_k,
                query_filter=query_filter,
                with_payload=True,
                with_vectors=False,
            )
            results = res.points
        else:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=top_k,
                query_filter=query_filter,
                with_payload=True,
                with_vectors=False,
            )

        return [
            {
                'id': hit.id,
                'score': hit.score,
                'payload': hit.payload,
            }
            for hit in results
        ]

    def get_chunks_by_document_id(self, document_id: str, limit: int = 5) -> List[dict]:
        """Fetch chunks for a specific document."""
        if self.client is None:
            self.connect()
        filter_doc = Filter(
            must=[
                FieldCondition(
                    key='document_id',
                    match=MatchValue(value=document_id),
                )
            ]
        )
        try:
            scroll_res = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_doc,
                limit=limit,
                with_payload=True,
                with_vectors=False,
            )
            return [p.payload for p in scroll_res[0] if p.payload]
        except Exception:
            return []

    def health_check(self) -> bool:
        """Check if Qdrant is accessible."""
        try:
            if self.client is None:
                self.connect()
            if self.client is None:
                return False
            self.client.get_collections()
            return True
        except Exception:
            return False

    def close(self) -> None:
        if self.client:
            self.client.close()
            self.client = None


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
        _vector_store.connect()
    return _vector_store