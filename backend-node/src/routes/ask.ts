import { Router, Response } from 'express';
import { z } from 'zod';
import { askQuestion } from '../services/aiClient.js';
import { BadRequestError } from '../schemas/errors.js';

const router = Router();

const askSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
});

router.post('/api/ask', async (req, res: Response) => {
  const parseResult = askSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError('Invalid question', parseResult.error.flatten().fieldErrors);
  }

  const { question } = parseResult.data;
  const result = await askQuestion(question.trim(), req.requestId);

  res.json({
    answer: result.answer,
    status: result.status,
    sources: result.sources,
  });
});

export default router;