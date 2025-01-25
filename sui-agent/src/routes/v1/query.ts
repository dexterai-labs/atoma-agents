import { Router } from 'express';
import { Request, Response, RequestHandler } from 'express';
import Agents from '../../agents/SuiAgent';
import { handleError } from '../../utils';
import { ServiceStatus, getServiceStatus } from '../../server';

/**
 * Express Router for handling AI agent queries
 * @type {Router}
 */
const queryRouter = Router();
const agent = new Agents();

/**
 * Determines if a query can be handled directly without AI
 * @param prompt - User's query
 * @returns Whether the query can be handled directly
 */
function canHandleDirectly(prompt: string): boolean {
  // List of keywords that indicate direct API calls are possible
  const directKeywords = [
    'price',
    'tvl',
    'exchange rate',
    'pool info',
    'staking positions',
    'stake',
    'unstake',
  ];

  return directKeywords.some((keyword) =>
    prompt.toLowerCase().includes(keyword.toLowerCase()),
  );
}

/**
 * POST /query
 * Processes user prompts through the AI agent and returns responses
 *
 * @route POST /query
 * @param {Request} req.body.prompt - The user's input prompt to be processed
 * @returns {Promise<Response>} JSON response containing the agent's processed output
 * @throws {Error} If the agent processing fails
 */
const handleQuery: RequestHandler = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json([
        handleError('No prompt provided', {
          reasoning: 'The request body is missing the required prompt field.',
          query: 'Attempted to process empty prompt',
        }),
      ]);
      return;
    }

    // Check service status
    const serviceStatus = getServiceStatus();
    if (serviceStatus === ServiceStatus.DEGRADED) {
      // If service is degraded but query can be handled directly, proceed
      if (canHandleDirectly(prompt)) {
        console.log('Handling query directly due to degraded AI service');
        const agentResponse = await agent.SuperVisorAgent(prompt);
        res.json(agentResponse);
        return;
      }

      // If query requires AI and service is degraded, return error
      res.status(503).json([
        handleError('AI service unavailable', {
          reasoning:
            'The AI service is currently unavailable for complex queries.',
          query: prompt,
        }),
      ]);
      return;
    }

    // Normal processing when service is healthy
    const agentResponse = await agent.SuperVisorAgent(prompt);
    res.json(agentResponse);
  } catch (error: unknown) {
    res.status(500).json([
      handleError(error, {
        reasoning: 'Failed to process agent query',
        query: `Attempted to process prompt: ${req.body.prompt || 'unknown'}`,
      }),
    ]);
  }
};

queryRouter.post('/query', handleQuery);

/**
 * GET /status
 * Returns current service status
 */
queryRouter.get('/status', (req: Request, res: Response) => {
  const status = getServiceStatus();
  res.json({ status });
});

/**
 * Middleware to handle unsupported HTTP methods
 *
 * @route ALL /*
 * @returns {Response} 405 status with error message
 */
const handleUnsupportedMethod: RequestHandler = (req, res) => {
  res.status(405).json([
    handleError('Method not allowed', {
      reasoning:
        'The requested HTTP method is not supported for this endpoint.',
      query: `${req.method} ${req.path}`,
    }),
  ]);
};

queryRouter.use(handleUnsupportedMethod);

export default queryRouter;
