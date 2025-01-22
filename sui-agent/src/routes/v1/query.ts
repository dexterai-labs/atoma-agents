import { Router } from 'express';
import { Request, Response } from 'express';
import Agents from '../../agents/Agent';

/**
 * Express Router for handling AI agent queries
 * @type {Router}
 */
const queryRouter = Router();
let agent = new Agents();

/**
 * POST /query
 * Processes user prompts through the AI agent and returns responses
 * 
 * @route POST /query
 * @param {Request} req.body.prompt - The user's input prompt to be processed
 * @returns {Promise<Response>} JSON response containing the agent's processed output
 * @throws {Error} If the agent processing fails
 */
queryRouter.post('/query', async (req: Request, res: Response) => {
  let { prompt } = req.body;
  let agentResponse = await agent.SuperVisorAgent(prompt);
  console.log(agentResponse, 'wow');
  res.json(agentResponse);
});

/**
 * Middleware to handle unsupported HTTP methods
 * 
 * @route ALL /*
 * @returns {Response} 405 status with error message
 */
queryRouter.use((r: any, res: any) => {
  return res.status(405).json({ err: 'method not allowed' });
});

export default queryRouter;
