import dotenv from 'dotenv';
import { AtomaSDK } from 'atoma-sdk';

dotenv.config();

const ATOMA_CHAT_COMPLETIONS_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';

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
  try {
    return await atomaSDK.chat.create({
      messages,
      model: model || ATOMA_CHAT_COMPLETIONS_MODEL,
      maxTokens: 128,
    });
  } catch (error) {
    // Log the error for monitoring
    console.error('Atoma service error:', error);

    // Return a fallback response that indicates service unavailability
    return {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                reasoning: 'Atoma service is currently unavailable',
                response:
                  'The AI service is temporarily unavailable. Please try direct API calls or check back later.',
                status: 'failure',
                query:
                  messages[messages.length - 1]?.content || 'Unknown query',
                errors: ['AI service unavailable'],
              },
            ]),
          },
        },
      ],
    };
  }
}

// Health check function that returns service status
async function isAtomaHealthy(): Promise<boolean> {
  try {
    await atomaSDK.health.health();
    return true;
  } catch (error) {
    console.error('Atoma health check failed:', error);
    return false;
  }
}

export { atomaChat, isAtomaHealthy };
export default atomaSDK;
