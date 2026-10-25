import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listDocuments, ingestDocument, deleteDocument, getDocumentSuggestions } from '../services/aiClient.js';
import { BadRequestError, UnsupportedFileTypeError, FileTooLargeError, NotFoundError } from '../schemas/errors.js';
import { AxiosError } from 'axios';

const router = Router();

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/docx',
  'application/msword',
];

const MAX_FILE_SIZE_MB = 10;

function validateFile(file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestError('No file provided');
  }

  const ext = (file.originalname || '').toLowerCase();
  const isDocxExt = ext.endsWith('.docx');
  const isMdExt = ext.endsWith('.md') || ext.endsWith('.markdown');
  const isTxtExt = ext.endsWith('.txt');
  const isPdfExt = ext.endsWith('.pdf');

  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype) && !isDocxExt && !isMdExt && !isTxtExt && !isPdfExt) {
    throw new UnsupportedFileTypeError(
      `Unsupported file type: ${file.mimetype}. Supported types: PDF, DOCX, Markdown, Text`
    );
  }

  const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new FileTooLargeError(
      `File size ${file.size} bytes exceeds maximum of ${maxBytes} bytes (${MAX_FILE_SIZE_MB}MB)`
    );
  }
}

// POST /api/documents - multipart upload
router.post('/', async (req, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file;
    validateFile(file);

    const result = await ingestDocument(file.buffer, file.originalname, file.mimetype, req.requestId);
    const responseBody: Record<string, unknown> = {
      document_id: result.document_id,
      filename: result.filename,
      status: result.status,
      chunk_count: result.chunk_count,
    };
    if (result.error_message) {
      responseBody.error_message = result.error_message;
    }
    res.status(201).json(responseBody);
  } catch (error) {
    next(error);
  }
});

// GET /api/documents - list documents
router.get('/', async (_req, res: Response, next: NextFunction) => {
  try {
    const result = await listDocuments(_req.requestId);
    res.json({
      documents: result.documents.map((doc) => {
        const docBody: Record<string, unknown> = {
          document_id: doc.document_id,
          filename: doc.filename,
          mime_type: doc.mime_type,
          content_hash: doc.content_hash,
          uploaded_at: doc.uploaded_at,
          status: doc.status,
          chunk_count: doc.chunk_count,
        };
        if (doc.error_message) {
          docBody.error_message = doc.error_message;
        }
        return docBody;
      }),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:documentId - delete document
router.delete('/:documentId', async (req, res: Response, next: NextFunction) => {
  const documentId = req.params.documentId;
  if (!documentId) {
    return next(new BadRequestError('Document ID is required'));
  }

  try {
    await deleteDocument(documentId, req.requestId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return next(new NotFoundError(`Document not found: ${documentId}`));
    }
    next(error);
  }
});

// GET /api/documents/:documentId/suggestions - get dynamic suggestions for document
router.get('/:documentId/suggestions', async (req, res: Response, next: NextFunction) => {
  const documentId = req.params.documentId;
  if (!documentId) {
    return next(new BadRequestError('Document ID is required'));
  }

  try {
    const data = await getDocumentSuggestions(documentId, req.requestId);
    res.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return next(new NotFoundError(`Document not found: ${documentId}`));
    }
    next(error);
  }
});

export default router;