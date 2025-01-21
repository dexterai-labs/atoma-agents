require("dotenv").config();
import { AtomaSDK } from "atoma-sdk";

// Initialize Atoma SDK with authentication
const atomaSDK = new AtomaSDK({
  bearerAuth: process.env.ATOMASDK_BEARER_AUTH,
});

/**
 * Helper function to create chat completions using Atoma SDK
 * @param messages - Array of message objects with content and role
 * @param model - Optional model identifier (defaults to Llama-3.3-70B-Instruct)
 * @returns Chat completion response
 */
async function atomaChat(
  messages: { content: string; role: string }[],
  model?: string,
) {
  return await atomaSDK.chat.create({
    messages,
    model: model || "meta-llama/Llama-3.3-70B-Instruct",
    maxTokens: 128,
  });
}

export { atomaChat };
export default atomaSDK;
