import { IntentAgentResponse } from '../@types/interface';
import Tools from '../tools/aftermath';
import { registerAllTools } from './ToolRegistry';
import Utils from '../utils';

/**
 * Tools instance for handling various tool-related operations
 * Used across the agent system for processing and executing tasks
 */
const tools = new Tools();

/**
 * Utils instance that provides utility functions
 * Initialized with tools instance for coordinated operations
 */
const utils = new Utils(tools);

/**
 * Main agent class that handles intent processing and decision making
 * Coordinates between different agent types to process user queries
 *
 * @example
 * const agent = new Agents();
 * const response = await agent.SuperVisorAgent("What is the current price of the Sui token?");
 * console.log(response);
 */
class Agents {
  /**
   * Processes initial user intent and selects appropriate tools
   * @param prompt - User's input query
   * @returns IntentAgentResponse containing tool selection and processing details
   */
  async IntentAgent(prompt: string) {
    // Register all available tools before processing
    registerAllTools(tools);
    const IntentResponse: IntentAgentResponse =
      (await tools.selectAppropriateTool(prompt)) as IntentAgentResponse;
    return IntentResponse;
  }

  /**
   * Makes decisions based on the intent response and user query
   * @param intentResponse - Response from the IntentAgent
   * @param query - Original user query
   * @returns Processed response after decision making
   */
  async DecisionMakingAgent(intentResponse: any, query: string) {
    return await utils.makeDecision(
      intentResponse as IntentAgentResponse,
      query,
    );
  }

  /**
   * Main entry point for processing user queries
   * Coordinates between IntentAgent and DecisionMakingAgent
   * @param prompt - User's input query
   * @returns Final processed response
   */
  async SuperVisorAgent(prompt: string) {
    // Process intent
    const res = await this.IntentAgent(prompt);
    console.log(res);

    // Make decision based on intent
    const finalAnswer = await this.DecisionMakingAgent(res, prompt);
    console.log(finalAnswer, 'final');
    return finalAnswer;
  }
}

export default Agents;
