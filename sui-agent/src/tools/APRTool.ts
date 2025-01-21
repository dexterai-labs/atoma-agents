import { Aftermath } from "aftermath-ts-sdk";

/**
 * Singleton class for managing Aftermath SDK interactions for APR calculations
 * Ensures only one instance of Aftermath client is created
 */
class AftermathTool {
  private static instance: Aftermath | null = null;

  /**
   * Gets or creates the Aftermath SDK instance
   * @returns Initialized Aftermath instance for mainnet
   */
  static getInstance(): Aftermath {
    if (!this.instance) {
      this.instance = new Aftermath("MAINNET");
    }
    return this.instance;
  }

  /**
   * Fetches APR (Annual Percentage Rate) for a specific token
   * @param tokenAddress - Address of the token to get APR for
   * @returns APR information for the token
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
