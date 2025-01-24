import intent_agent_prompt from '../prompts/intent_agent_prompt';

import { Tool, ToolParameter, toolResponse } from '../../@types/interface';
import { atomaChat } from '../config/atoma';

/**
 * Main tools management class
 * Handles registration and selection of tools for processing user queries
 */
class Tools {
  private tools: Tool[] = [];
  private prompt: string;

  constructor() {
    this.prompt = intent_agent_prompt;
  }

  /**
   * Register a new tool with the system
   * @param name - Name of the tool
   * @param description - Description of what the tool does
   * @param parameters - Parameters the tool accepts
   * @param process - Function to execute the tool
   */
  registerTool(
    name: string,
    description: string,
    parameters: ToolParameter[],
    process: (...args: any[]) => Promise<string> | string,
  ): void {
    const tool: Tool = {
      name,
      description,
      parameters,
      process,
    };
    this.tools.push(tool);
  }

  /**
   * Select appropriate tool based on user query
   * @param query - User's input query
   * @returns Selected tool response or null if no tool matches
   */
  async selectAppropriateTool(query: string): Promise<toolResponse | null> {
    const finalPrompt = this.prompt.replace(
      '${toolsList}',
      JSON.stringify(this.getAllTools()),
    );

    const ai: any = await atomaChat([
      {
        content: finalPrompt,
        role: 'system',
      },
      {
        content: query || '',
        role: 'user',
      },
    ]);
    const res = ai.choices[0].message.content;

    const applicableTools: toolResponse[] = JSON.parse(res);
    if (applicableTools.length > 0) return applicableTools[0];

    return null;
  }

  /**
   * Get list of all registered tools
   * @returns Array of registered tools
   */
  getAllTools(): Tool[] {
    return this.tools;
  }
}
export default Tools;

//   tools.registerTool("Tool 1", "Description of Tool 1", () => {
//     return "Tool 1 has been processed successfully.";
//   });
//   tools.registerTool("Tool 2", "Description of Tool 2", () => {
//     return "Tool 2 has been processed successfully.";
//   });
//   tools.registerTool("Tool 3", "Description of Tool 3", () => {
//     return "Tool 3 has been processed successfully.";
//   });

//   // Selecting a tool based on query
//   const query = "Tool 1";
//   const selectedTool = tools.selectAppropriateTool(query);

//   if (selectedTool) {
//     console.log(`Selected Tool: ${selectedTool.name}`);
//     const result = selectedTool.process(); // Running the tool's process method
//     console.log(result); // Output similar format for all tools
//   } else {
//     console.log("No tool found for the query.");
//   }
