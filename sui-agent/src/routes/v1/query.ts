import { Router } from 'express';
import { Request, Response } from 'express';
import Agents from '../../agents/Agent';

const queryRouter = Router();
let agent = new Agents();

/**
 * POST /query
 * Handles user queries and returns agent responses
 */
queryRouter.post('/query', async (req: Request, res: Response) => {
  let { prompt } = req.body;
  let agentResponse = await agent.SuperVisorAgent(prompt);
  console.log(agentResponse, 'wow');
  res.json(agentResponse);
});

// Handle unsupported methods
queryRouter.use((r: any, res: any) => {
  return res.status(405).json({ err: 'method not allowed' });
});

export default queryRouter;
