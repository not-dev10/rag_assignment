from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    PROCESSING = 'processing'
    READY = 'ready'
    FAILED = 'failed'


class DocumentIngestResponse(BaseModel):
    document_id: str
    filename: str
    status: DocumentStatus
    chunk_count: int
    error_message: Optional[str] = None


class DocumentListItem(BaseModel):
    document_id: str
    filename: str
    mime_type: str
    content_hash: str
    uploaded_at: datetime
    status: DocumentStatus
    chunk_count: int
    error_message: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentListItem]


class HealthResponse(BaseModel):
    status: str = 'ok'


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class Source(BaseModel):
    filename: str
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    chunk_id: str
    excerpt: str


class AskStatus(str, Enum):
    ANSWERED = 'answered'
    FALLBACK = 'fallback'


class AskResponse(BaseModel):
    answer: str
    status: AskStatus
    sources: List[Source] = []


class ErrorResponse(BaseModel):
    error: dict
    request_id: Optional[str] = None


class ChunkMetadata(BaseModel):
    document_id: str
    filename: str
    chunk_index: int
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    content_hash: str


class Chunk(BaseModel):
    chunk_id: str
    text: str
    metadata: ChunkMetadata
    embedding: Optional[List[float]] = None