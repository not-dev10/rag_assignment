import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { loadConfig } from './config.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './services/logger.js';
import healthRoutes from './routes/health.js';
import documentRoutes from './routes/documents.js';
import askRoutes from './routes/ask.js';

const config = loadConfig();

const allowedTypes = [
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
];

const upload = multer({
  limits: {
    fileSize: config.MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: config.NODE_ENV === 'development' ? true : false,
    credentials: false,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  app.use('/api/health', healthRoutes);
  app.use('/api/documents', upload.single('file'), documentRoutes);
  app.use('/api/ask', askRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function startServer(app: express.Application): Promise<void> {
  return new Promise((resolve) => {
    const server = app.listen(config.PORT, () => {
      logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started');
      resolve();
    });

    server.on('error', (error) => {
      logger.error({ err: error }, 'Server error');
      process.exit(1);
    });
  });
}