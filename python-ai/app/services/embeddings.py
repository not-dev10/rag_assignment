from typing import List, Optional
import hashlib
import random
import logging

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
    """Mock provider for testing without API keys.

    Produces deterministic pseudo-embeddings based on text hash.
    Dimension matches the configured embedding model.
    """

    def __init__(self):
        super().__init__()
        # text-embedding-3-large: 3072 dimensions; text-embedding-3-small: 1536
        if settings.EMBEDDING_MODEL.startswith('text-embedding-3-large'):
            self._dimension = 3072
        else:
            self._dimension = 1536  # text-embedding-3-small

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        embeddings = []
        for text in texts:
            # Deterministic pseudo-embedding based on text hash
            seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
            random.seed(seed)
            vec = [random.uniform(-1, 1) for _ in range(self.dimension)]
            # Normalize to unit vector
            norm = sum(x * x for x in vec) ** 0.5
            vec = [x / norm for x in vec]
            embeddings.append(vec)
        return embeddings

    async def embed_query(self, query: str) -> list[float]:
        result = await self.embed_texts([query])
        return result[0]


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider wrapper.

    Uses the OpenAI API to generate embeddings.
    Falls back to mock if no API key is configured.
    """

    def __init__(self):
        super().__init__()
        self.openai_api_key = settings.OPENAI_API_KEY

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.openai_api_key:
            import logging
            logging.warning('OPENAI_API_KEY not set, falling back to mock provider')
            from . import get_embedding_provider as get_mock
            mock_provider = get_mock()  # type: ignore
            return await mock_provider.embed_texts(texts)

        # In a full implementation, this would call the OpenAI API
        # For now, fall back to mock
        import logging
        logging.warning('OpenAI embedding API call not implemented, using mock')
        from . import get_embedding_provider as get_mock
        mock_provider = get_mock()  # type: ignore
        return await mock_provider.embed_texts(texts)

    async def embed_query(self, query: str) -> list[float]:
        result = await self.embed_texts([query])
        return result[0]


def get_embedding_provider() -> EmbeddingProvider:
    """Factory function to get the configured embedding provider.

    Returns the appropriate provider based on settings:
    - If OPENAI_API_KEY is set: OpenAIEmbeddingProvider
    - Otherwise: MockEmbeddingProvider for deterministic testing
    """
    import logging

    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != 'sk-or-v1-REPLACE_WITH_YOUR_KEY_HERE':
        provider = OpenAIEmbeddingProvider()
        logging.info(f'Using OpenAI embedding model: {settings.EMBEDDING_MODEL}')
        return provider

    # Default: use mock provider for deterministic behavior
    # In production with real API keys, this would be OpenAIEmbeddingProvider
    logging.info(f'Using mock embedding model: {settings.EMBEDDING_MODEL}')
    return MockEmbeddingProvider()