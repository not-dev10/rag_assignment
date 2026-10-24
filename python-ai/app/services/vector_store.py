from typing import Optional, List
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

        try:
            if settings.QDRANT_API_KEY:
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY,
                )
            else:
                self.client = QdrantClient(url=settings.QDRANT_URL)

            self._ensure_collection()
        except Exception as e:
            raise VectorStoreError(f'Failed to connect to Qdrant: {e}')

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
            if 'Not found' in str(e) or 'doesn\'t exist' in str(e):
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

        # Create payload indexes for common filter fields
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name='document_id',
            field_schema='keyword',
        )
        self.client.create_payload_index(
            collection_name=self.collection_name,
            field_name='filename',
            field_schema='keyword',
        )

    def upsert_chunks(self, chunks: List[Chunk]) -> int:
        """Upsert chunks into Qdrant. Returns count of upserted points."""
        if self.client is None:
            raise VectorStoreError('Client not connected')

        if not chunks:
            return 0

        texts = [chunk.text for chunk in chunks]
        embeddings = self.embedding_provider.embed_texts(texts)

        points = []
        for chunk, embedding in zip(chunks, embeddings):
            payload = {
                'document_id': chunk.metadata.document_id,
                'filename': chunk.metadata.filename,
                'chunk_index': chunk.metadata.chunk_index,
                'text': chunk.text,
                'content_hash': chunk.metadata.content_hash,
            }
            if chunk.metadata.page_number is not None:
                payload['page_number'] = chunk.metadata.page_number
            if chunk.metadata.section_title is not None:
                payload['section_title'] = chunk.metadata.section_title
            if chunk.metadata.start_char is not None:
                payload['start_char'] = chunk.metadata.start_char
            if chunk.metadata.end_char is not None:
                payload['end_char'] = chunk.metadata.end_char

            points.append(PointStruct(
                id=chunk.chunk_id,
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

        result = self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key='document_id',
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )
        return result.deleted_count if hasattr(result, 'deleted_count') else 0

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

    def health_check(self) -> bool:
        """Check if Qdrant is accessible."""
        try:
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