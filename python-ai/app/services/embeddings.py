from app.config import settings


class EmbeddingProvider:
    """Base class for embedding providers."""

    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self._dimension: int | None = None

    @property
    def dimension(self) -> int:
        if self._dimension is None:
            raise NotImplementedError('Dimension not set')
        return self._dimension

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError

    async def embed_query(self, query: str) -> list[float]:
        raise NotImplementedError


class MockEmbeddingProvider(EmbeddingProvider):
    """Mock provider for testing without API keys."""

    def __init__(self):
        super().__init__()
        self._dimension = 1536  # text-embedding-3-small dimension

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        import hashlib
        import random

        embeddings = []
        for text in texts:
            # Deterministic pseudo-embedding based on text hash
            seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
            random.seed(seed)
            vec = [random.uniform(-1, 1) for _ in range(self.dimension)]
            # Normalize
            norm = sum(x * x for x in vec) ** 0.5
            vec = [x / norm for x in vec]
            embeddings.append(vec)
        return embeddings

    async def embed_query(self, query: str) -> list[float]:
        result = await self.embed_texts([query])
        return result[0]


def get_embedding_provider() -> EmbeddingProvider:
    """Factory function to get the configured embedding provider."""
    provider_name = settings.LLM_PROVIDER.lower()

    if provider_name == 'mock' or not settings.OPENAI_API_KEY:
        return MockEmbeddingProvider()

    # OpenAI provider would be implemented here
    # For now, fall back to mock with a warning
    import logging
    logging.warning('OpenAI provider not fully implemented, using mock')
    return MockEmbeddingProvider()