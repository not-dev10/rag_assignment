from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    # LLM Provider
    LLM_PROVIDER: str = Field(default='openai')
    LLM_MODEL: str = Field(default='gpt-4o-mini')
    EMBEDDING_MODEL: str = Field(default='text-embedding-3-small')
    OPENAI_API_KEY: str = Field(default='')
    OPENROUTER_API_KEY: Optional[str] = Field(default=None)
    OPENROUTER_BASE_URL: str = Field(default='https://openrouter.ai/api/v1')

    # Qdrant
    QDRANT_URL: str = Field(default='http://localhost:6333')
    QDRANT_API_KEY: Optional[str] = Field(default=None)
    QDRANT_COLLECTION: str = Field(default='knowledge_chunks')

    # Storage
    UPLOAD_DIR: str = Field(default='./data/uploads')

    # Retrieval
    TOP_K: int = Field(default=4)
    SIMILARITY_THRESHOLD: Optional[float] = Field(default=None)

    # Chunking
    CHUNK_SIZE: int = Field(default=800)
    CHUNK_OVERLAP: int = Field(default=120)

    # Upload
    MAX_UPLOAD_MB: int = Field(default=10)

    # Logging
    LOG_LEVEL: str = Field(default='INFO')


settings = Settings()