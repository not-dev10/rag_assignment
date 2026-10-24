import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../schemas/errors.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const requestId = _req.requestId || 'unknown';

  if (err instanceof AppError) {
    _req.log?.warn(
      { err: { code: err.code, message: err.message, details: err.details } },
      'Application error'
    );

    const responseBody: Record<string, unknown> = {
      error: {
        code: err.code,
        message: err.message,
      },
      requestId,
    };

    if (err.details !== undefined) {
      (responseBody.error as Record<string, unknown>).details = err.details;
    }

    return res.status(err.statusCode).json(responseBody);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    _req.log?.warn({ err: err.message }, 'Validation error');
    return res.status(400).json({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: err.message,
      },
      requestId,
    });
  }

  // Handle axios/network errors
  if (err.name === 'AxiosError' || err.message.includes('ECONNREFUSED')) {
    _req.log?.error({ err: err.message }, 'AI service connection failed');
    return res.status(503).json({
      error: {
        code: ErrorCode.AI_SERVICE_UNAVAILABLE,
        message: 'AI service is temporarily unavailable',
      },
      requestId,
    });
  }

  // Unexpected errors
  _req.log?.error({ err: err.message, stack: err.stack }, 'Unexpected error');
  return res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
    requestId,
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
}