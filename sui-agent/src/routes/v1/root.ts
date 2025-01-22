import { Router } from 'express';
import { Request, Response } from 'express';

const rootRouter = Router();

/**
 * GET /
 * Basic root endpoint that returns a welcome message
 */
rootRouter.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

/**
 * GET /health
 * Health check endpoint for monitoring service status
 */
rootRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ msg: 'ok' });
});

export default rootRouter;
