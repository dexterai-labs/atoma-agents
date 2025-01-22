import { Aftermath } from 'aftermath-ts-sdk';

/**
 * Singleton class for managing Aftermath SDK interactions for APR calculations.
 * This class provides a centralized interface for interacting with the Aftermath SDK,
 * specifically for retrieving APR (Annual Percentage Rate) information for tokens.
 * It implements the Singleton pattern to ensure only one instance of the Aftermath client exists.
 */
class AftermathTool {
  private static instance: Aftermath | null = null;

  /**
   * Gets or creates the Aftermath SDK instance.
   * If an instance doesn't exist, it creates a new one configured for mainnet.
   * Subsequent calls will return the same instance.
   * 
   * @returns {Aftermath} Initialized Aftermath instance for mainnet
   * @throws {Error} If initialization of Aftermath SDK fails
   */
  static getInstance(): Aftermath {
    if (!this.instance) {
      this.instance = new Aftermath('MAINNET');
    }
    return this.instance;
  }

  /**
   * Fetches APR (Annual Percentage Rate) information for a specific token.
   * 
   * @param {string} tokenAddress - The blockchain address of the token to get APR for
   * @returns {Promise<any>} A promise that resolves to the APR information for the token
   *                         or an error message if the request fails
   * @throws {Error} If the Aftermath SDK call fails, returns error message as string
   * 
   * @example
   * ```typescript
   * const apr = await AftermathTool.getTokenAPR("0x123...abc");
   * ```
   */
  static async getTokenAPR(tokenAddress: string): Promise<any> {
    try {
      const aftermath = this.getInstance();
      const apr = await aftermath.Prices();
      return apr;
    } catch (error: any) {
      return `Error fetching APR: ${error.message}`;
    }
  }
}

export const getTokenAPR = AftermathTool.getTokenAPR.bind(AftermathTool);
