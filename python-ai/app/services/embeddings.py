import hashlib
import random
import logging
import asyncio

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
        # Set dimension based on model
        if 'large' in settings.EMBEDDING_MODEL:
            self._dimension = 3072
        else:
            self._dimension = 1536

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.openai_api_key or len(self.openai_api_key) < 20:
            raise RuntimeError('OpenAI embedding provider is configured without a valid API key')

        from openai import OpenAI
        last_error: Exception | None = None
        for attempt in range(settings.EMBEDDING_MAX_RETRIES):
            try:
                client = OpenAI(api_key=self.openai_api_key)
                response = client.embeddings.create(input=texts, model=self.model_name)
                logging.info(f"Generated embeddings using {self.model_name}")
                return [data.embedding for data in response.data]
            except Exception as error:
                last_error = error
                if attempt + 1 < settings.EMBEDDING_MAX_RETRIES:
                    await asyncio.sleep(2 ** attempt)
        raise RuntimeError(f'OpenAI embedding request failed: {last_error}') from last_error

    async def embed_query(self, query: str) -> list[float]:
        result = await self.embed_texts([query])
        return result[0]


class OpenRouterEmbeddingProvider(EmbeddingProvider):
    """OpenRouter embedding provider using text-embedding-3-small or text-embedding-3-large.
    
    Uses OpenRouter's API which is compatible with OpenAI's embedding endpoint.
    """

    def __init__(self):
        super().__init__()
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        # OpenRouter uses same OpenAI models, set dimension based on model
        if 'large' in settings.EMBEDDING_MODEL:
            self._dimension = 3072
        else:
            self._dimension = 1536

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key or len(self.api_key) < 20:
            raise RuntimeError('OpenRouter embedding provider is configured without a valid API key')

        from openai import OpenAI
        last_error: Exception | None = None
        for attempt in range(settings.EMBEDDING_MAX_RETRIES):
            try:
                client = OpenAI(api_key=self.api_key, base_url=self.base_url)
                response = client.embeddings.create(
                    input=texts,
                    model=settings.EMBEDDING_MODEL,
                )
                logging.info(f"Generated {len(texts)} embeddings via OpenRouter using {settings.EMBEDDING_MODEL}")
                return [data.embedding for data in response.data]
            except Exception as error:
                last_error = error
                if attempt + 1 < settings.EMBEDDING_MAX_RETRIES:
                    await asyncio.sleep(2 ** attempt)
        raise RuntimeError(f'OpenRouter embedding request failed: {last_error}') from last_error

    async def embed_query(self, query: str) -> list[float]:
        result = await self.embed_texts([query])
        return result[0]


def get_embedding_provider() -> EmbeddingProvider:
    """Factory function to get the configured embedding provider.

    Returns the appropriate provider based on settings (in priority order):
    1. OpenRouter (if OPENROUTER_API_KEY is set)
    2. OpenAI (if OPENAI_API_KEY is valid)
    3. Mock (fallback for testing without API keys)
    """
    # Try OpenRouter first (preferred)
    if settings.OPENROUTER_API_KEY and len(settings.OPENROUTER_API_KEY) > 20:
        provider = OpenRouterEmbeddingProvider()
        logging.info(f'Using OpenRouter embedding model: {settings.EMBEDDING_MODEL}')
        return provider
    
    # Fall back to OpenAI if configured
    has_valid_openai_key = (
        settings.OPENAI_API_KEY
        and len(settings.OPENAI_API_KEY) > 20
        and settings.OPENAI_API_KEY.startswith('sk-')
    )
    
    if has_valid_openai_key:
        provider = OpenAIEmbeddingProvider()
        logging.info(f'Using OpenAI embedding model: {settings.EMBEDDING_MODEL}')
        return provider

    # Last resort: mock embeddings
    logging.warning(f'No valid API keys found. Using mock embedding model (dimension: {MockEmbeddingProvider().dimension})')
    return MockEmbeddingProvider()