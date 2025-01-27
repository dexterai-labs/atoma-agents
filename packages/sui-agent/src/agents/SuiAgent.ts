import { IntentAgentResponse } from '../@types/interface';
import Tools from '../tools/aftermath';
import { registerAllTools } from './ToolRegistry';
import Utils from '../utils';
import intent_agent_prompt from '../prompts/intent_agent_prompt';
import final_answer_agent_prompt from '../prompts/final_answer_agent';

/**
 * Main agent class that handles intent processing and decision making
 * Coordinates between different agent types to process user queries
 *
 * @example
 * const agent = new Agents("your-bearer-auth-token");
 * const response = await agent.SuperVisorAgent("What is the current price of the Sui token?");
 * console.log(response);
 */
class Agents {
  private tools: Tools;
  private utils: Utils;

  constructor(bearerAuth: string) {
    this.tools = new Tools(bearerAuth, intent_agent_prompt);
    this.utils = new Utils(bearerAuth, final_answer_agent_prompt);
  }

  /**
   * Processes initial user intent and selects appropriate tools
   * @param prompt - User's input query
   * @returns IntentAgentResponse containing tool selection and processing details
   */
  async IntentAgent(prompt: string) {
    // Register all available tools before processing
    registerAllTools(this.tools);
    const IntentResponse: IntentAgentResponse =
      (await this.tools.selectAppropriateTool(prompt)) as IntentAgentResponse;
    return IntentResponse;
  }

  /**
   * Makes decisions based on the intent response and user query
   * @param intentResponse - Response from the IntentAgent
   * @param query - Original user query
   * @returns Processed response after decision making
   */
  async DecisionMakingAgent(intentResponse: any, query: string) {
    return await this.utils.processQuery(query);
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
