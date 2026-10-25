from typing import Optional, List
import hashlib
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
            logging.warning(
                f'Failed to connect to configured Qdrant ({e}), falling back to in-memory Qdrant'
            )
            try:
                self.client = QdrantClient(location=':memory:')
                self._ensure_collection()
            except Exception as inner_e:
                raise VectorStoreError(f'Failed to initialize Qdrant: {inner_e}')

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

        # Create payload indexes for common filter fields (local Qdrant logs a harmless warning)
        for field in ['document_id', 'filename', 'content_hash']:
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema='keyword',
                )
            except Exception:
                pass

    async def upsert_chunks(self, chunks: List[Chunk]) -> int:
        """Upsert chunks into Qdrant. Returns count of upserted points."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        if not chunks:
            return 0

        texts = [chunk['text'] if isinstance(chunk, dict) else chunk.text for chunk in chunks]
        res = self.embedding_provider.embed_texts(texts)
        import inspect
        if inspect.isawaitable(res):
            embeddings = await res
        else:
            embeddings = res

        points = []
        import uuid
        for chunk, embedding in zip(chunks, embeddings):
            if isinstance(chunk, dict):
                text = chunk.get('text', '')
                doc_id = chunk.get('document_id')
                fn = chunk.get('filename')
                c_idx = chunk.get('chunk_index', 0)
                c_hash = chunk.get('content_hash')
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
            }
            if page_no is not None:
                payload['page_number'] = page_no
            if sec_title is not None:
                payload['section_title'] = sec_title
            if start_c is not None:
                payload['start_char'] = start_c
            if end_c is not None:
                payload['end_char'] = end_c

            # Deterministic valid UUID point ID from MD5 digest
            point_id = str(uuid.UUID(hashlib.md5(text.encode()).hexdigest()))

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

        from qdrant_client.models import PointIdsList

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
                limit=1000,
                with_payload=False,
                with_vectors=False,
            )
            matching = scroll_res[0]
            if not matching:
                return 0
            ids = [p.id for p in matching]
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=PointIdsList(points=ids),
            )
            return len(ids)
        except Exception:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=filter_doc,
            )
            return 1

    def search(
        self,
        query_vector: List[float],
        top_k: int = None,
        document_id: Optional[str] = None,
    ) -> List[dict]:
        """Search for similar chunks. Returns list of scored points with payload."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        if top_k is None:
            top_k = settings.TOP_K

        query_filter = None
        if document_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key='document_id',
                        match=MatchValue(value=document_id),
                    )
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