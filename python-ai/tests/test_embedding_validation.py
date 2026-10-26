import pytest

from app.services.vector_store import VectorStore, VectorStoreError


class FakeProvider:
    model_name = 'test-model'
    dimension = 3

    def __init__(self, mode='ok'):
        self.mode = mode
        self.calls = []

    async def embed_texts(self, texts):
        self.calls.append(list(texts))
        if self.mode == 'count':
            return [[0.1, 0.2, 0.3]]
        if self.mode == 'dimension':
            return [[0.1, 0.2]]
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeClient:
    def __init__(self):
        self.points = []

    def upsert(self, collection_name, points):
        self.points.extend(points)


def make_chunk(document_id, index, text):
    return {
        'document_id': document_id,
        'filename': f'{document_id}.txt',
        'chunk_index': index,
        'text': text,
        'content_hash': f'chunk-{index}',
        'document_content_hash': f'document-{document_id}',
    }


@pytest.mark.asyncio
async def test_embeddings_are_batched_and_point_ids_are_document_specific(monkeypatch):
    monkeypatch.setattr('app.config.settings.EMBEDDING_BATCH_SIZE', 2)
    store = VectorStore()
    store.client = FakeClient()
    provider = FakeProvider()
    store.embedding_provider = provider

    chunks = [
        make_chunk('one', 0, 'same text'),
        make_chunk('one', 1, 'same text'),
        make_chunk('two', 0, 'same text'),
    ]
    assert await store.upsert_chunks(chunks) == 3
    assert [len(call) for call in provider.calls] == [2, 1]
    assert len({point.id for point in store.client.points}) == 3


@pytest.mark.asyncio
async def test_embedding_count_mismatch_fails_ingestion(monkeypatch):
    monkeypatch.setattr('app.config.settings.EMBEDDING_BATCH_SIZE', 32)
    store = VectorStore()
    store.client = FakeClient()
    store.embedding_provider = FakeProvider(mode='count')

    with pytest.raises(VectorStoreError, match='count mismatch'):
        await store.upsert_chunks([make_chunk('one', 0, 'a'), make_chunk('one', 1, 'b')])


@pytest.mark.asyncio
async def test_embedding_dimension_mismatch_fails_ingestion(monkeypatch):
    store = VectorStore()
    store.client = FakeClient()
    store.embedding_provider = FakeProvider(mode='dimension')

    with pytest.raises(VectorStoreError, match='dimension mismatch'):
        await store.upsert_chunks([make_chunk('one', 0, 'a')])
