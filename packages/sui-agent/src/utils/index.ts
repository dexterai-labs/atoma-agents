import final_answer_agent_prompt from '../prompts/final_answer_agent';
import { atomaChat } from '../config/atoma';
import Tools from '../tools/aftermath';
import { IntentAgentResponse } from '../../@types/interface';
import { randomUUID } from 'crypto';

/**
 * Utility class for processing agent responses and making decisions
 * Handles the execution of tools and formatting of final responses
 */
class Utils {
  private tools: Tools;

  constructor(tools: Tools) {
    this.tools = tools;
  }

  /**
   * Makes decisions based on intent agent response and executes appropriate actions
   * @param intent_agent_response - Response from the intent agent
   * @param query - Original user query
   * @param tools - Optional tools configuration
   * @returns Processed and formatted response
   */
  async makeDecision(
    intent_agent_response: IntentAgentResponse,
    query: string,
    tools?: any,
  ) {
    if (intent_agent_response.success && intent_agent_response.selected_tool) {
      return await this.executeTools(
        intent_agent_response.selected_tool,
        intent_agent_response.tool_arguments,
      );
    } else {
      return await this.finalAnswer(
        intent_agent_response.response,
        query,
        tools,
      );
    }
  }

  /**
   * Formats and processes the final answer using the AI model
   * @param response - Raw response to be formatted
   * @param query - Original user query
   * @param tools - Optional tools used in processing
   * @returns Formatted final response
   * @private
   */
  private async finalAnswer(response: any, query: string, tools?: any) {
    const finalPrompt = final_answer_agent_prompt
      .replace('${query}', query)
      .replace('${response}', response)
      .replace('tools', `${tools || null}`);

    const finalAns: any = await atomaChat([
      {
        content: finalPrompt,
        role: 'assistant',
      },
    ]);
    const res = finalAns.choices[0].message.content;
    console.log(finalPrompt);
    return JSON.parse(res);
  }

  /**
   * Executes selected tools with provided arguments
   * @param selected_tool - Name of the tool to execute
   * @param args - Arguments to pass to the tool
   * @returns Processed tool response
   * @private
   */
  private async executeTools(selected_tool: string, args: any[] | null) {
    const tool = this.tools.getAllTools().find((t) => t.name === selected_tool);
    console.log('Selected tool:', selected_tool);
    console.log('Tool arguments:', args);

    if (!tool) {
      throw new Error(`Tool ${selected_tool} not found`);
    }

    try {
      const toolArgs = args || [];
      const result = await tool.process(...toolArgs);
      return await this.finalAnswer(result, '', selected_tool);
    } catch (error: unknown) {
      console.error('Error executing tool:', error);
      return handleError(error, {
        reasoning: `The system encountered an issue while executing the tool ${selected_tool}`,
        query: `Attempted to execute ${selected_tool} with arguments: ${JSON.stringify(args)}`,
      });
    }
  }
}

export default Utils;

/**
 * Define custom error type for structured error responses
 */
export type StructuredError = {
  reasoning: string;
  response: string;
  status: 'failure';
  query: string;
  errors: string[];
};

/**
 * Type guard for Error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Generic error handler that creates a structured error response
 */
export function handleError(
  error: unknown,
  context: {
    reasoning: string;
    query: string;
  },
): StructuredError {
  const errorId = randomUUID();

  let errorMessage: string;
  if (isError(error)) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error occurred';
  }

  return {
    reasoning: context.reasoning,
    response: 'Operation unsuccessful',
    status: 'failure',
    query: context.query,
    errors: [`Error ID: ${errorId} - ${errorMessage}`],
  };
}
