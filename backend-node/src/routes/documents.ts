import { Router, Response } from 'express';
import { z } from 'zod';
import { listDocuments, ingestDocument, deleteDocument } from '../services/aiClient.js';
import { BadRequestError, UnsupportedFileTypeError, FileTooLargeError, NotFoundError } from '../schemas/errors.js';
import { AxiosError } from 'axios';

const router = Router();

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
];

const MAX_FILE_SIZE_MB = 10;

function validateFile(file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestError('No file provided');
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    throw new UnsupportedFileTypeError(
      `Unsupported file type: ${file.mimetype}. Supported types: PDF, Markdown, Text`
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
router.post('/', async (req, res: Response) => {
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
    if (error instanceof BadRequestError || error instanceof UnsupportedFileTypeError || error instanceof FileTooLargeError) {
      throw error;
    }
    throw error;
  }
});

// GET /api/documents - list documents
router.get('/', async (_req, res: Response) => {
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
});

// DELETE /api/documents/:documentId - delete document
router.delete('/:documentId', async (req, res: Response) => {
  const documentId = req.params.documentId;
  if (!documentId) {
    throw new BadRequestError('Document ID is required');
  }

  try {
    await deleteDocument(documentId, req.requestId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      throw new NotFoundError(`Document not found: ${documentId}`);
    }
    throw error;
  }
});

export default router;