import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { askQuestion } from '../services/aiClient.js';
import { BadRequestError } from '../schemas/errors.js';

const router = Router();

const askSchema = z.object({
  question: z.string().trim().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  document_id: z.string().optional(),
});

router.post('/', async (req, res: Response, next: NextFunction) => {
  try {
    const parseResult = askSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new BadRequestError('Invalid question', parseResult.error.flatten().fieldErrors);
    }

    const { question, document_id } = parseResult.data;
    const startTime = performance.now();
    const result = await askQuestion(question.trim(), req.requestId, document_id);
    const latencyMs = Math.round(performance.now() - startTime);

    res.json({
      answer: result.answer,
      status: result.status,
      isFallback: result.status === 'fallback',
      sources: result.sources,
      citations: result.sources,
      retrievalContext: result.retrieval_context || '',
      latencyMs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;