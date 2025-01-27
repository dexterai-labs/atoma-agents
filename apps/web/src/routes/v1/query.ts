import { Router } from 'express';
import { Request, Response } from 'express';

const queryRouter: Router = Router();

// Health check endpoint
queryRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Query endpoint
const handleQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query) {
      res.status(400).json({
        error: 'Missing query in request body',
      });
      return;
    }

    // TODO: Implement query handling with sui-agent
    res.json({ message: 'Query received', query });
  } catch (error) {
    console.error('Error handling query:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// Handle unsupported methods
const handleUnsupportedMethod = (req: Request, res: Response): void => {
  res.status(405).json({
    error: 'Method not allowed',
  });
};

queryRouter.post('/', handleQuery);
queryRouter.all('/', handleUnsupportedMethod);

export default queryRouter;
