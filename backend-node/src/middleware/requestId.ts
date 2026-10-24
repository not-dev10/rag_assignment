import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger } from '../services/logger.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: ReturnType<typeof createRequestLogger>;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = requestId;
  req.log = createRequestLogger(requestId);
  req.log.info({ method: req.method, url: req.url }, 'Request started');
  next();
}