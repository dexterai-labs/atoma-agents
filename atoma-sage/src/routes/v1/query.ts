import { Router } from 'express';
import { Request, Response, RequestHandler } from 'express';
import Agents from '../../agents/AtomaAgent';
import { handleError } from '../../utils';

/**
 * Express Router for handling AI agent queries
 * @type {Router}
 */
const queryRouter = Router();
const agent = new Agents();

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
    const agentResponse = await agent.SuperVisorAgent(prompt);
    console.log(agentResponse, 'wow');
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
