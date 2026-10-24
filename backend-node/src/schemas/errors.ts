export enum ErrorCode {
  INVALID_QUESTION = 'INVALID_QUESTION',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  RETRIEVAL_FAILED = 'RETRIEVAL_FAILED',
  MODEL_PROVIDER_ERROR = 'MODEL_PROVIDER_ERROR',
  INVALID_DOCUMENT_ID = 'INVALID_DOCUMENT_ID',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  INGESTION_FAILED = 'INGESTION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.INVALID_QUESTION, message, 400, details);
    this.name = 'BadRequestError';
  }
}

export class UnsupportedFileTypeError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.UNSUPPORTED_FILE_TYPE, message, 400, details);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class FileTooLargeError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.FILE_TOO_LARGE, message, 413, details);
    this.name = 'FileTooLargeError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.DOCUMENT_NOT_FOUND, message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class AIServiceUnavailableError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.AI_SERVICE_UNAVAILABLE, message, 503, details);
    this.name = 'AIServiceUnavailableError';
  }
}

export class RetrievalFailedError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.RETRIEVAL_FAILED, message, 502, details);
    this.name = 'RetrievalFailedError';
  }
}

export class ModelProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.MODEL_PROVIDER_ERROR, message, 502, details);
    this.name = 'ModelProviderError';
  }
}

export class IngestionFailedError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.INGESTION_FAILED, message, 500, details);
    this.name = 'IngestionFailedError';
  }
}