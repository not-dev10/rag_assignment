import { Router, Response } from 'express';
import { checkPythonHealth } from '../services/aiClient.js';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const pythonHealth = await checkPythonHealth();

  const response = {
    status: 'ok',
    service: 'backend-node',
    timestamp: new Date().toISOString(),
    dependencies: {
      python_ai: {
        status: pythonHealth.healthy ? 'healthy' : 'unhealthy',
        ...(pythonHealth.details && { details: pythonHealth.details }),
      },
    },
  };

  const statusCode = pythonHealth.healthy ? 200 : 503;
  res.status(statusCode).json(response);
});

export default router;