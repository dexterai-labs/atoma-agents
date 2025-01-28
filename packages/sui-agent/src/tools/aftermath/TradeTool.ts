import { Aftermath, Pool } from 'aftermath-ts-sdk';
import { handleError } from '../../utils';

// Initialize Aftermath SDK for mainnet
const af = new Aftermath('MAINNET');
const pools = af.Pools();

/**
 * Helper function to find matching tokens in a pool
 * @param pool - Pool data containing available tokens
 * @param coinInType - Input token type to find
 * @param coinOutType - Output token type to find
 * @returns Object containing matched input and output token addresses
 * @throws Error if tokens are not found in the pool
 */
async function findTokensInPool(
  pool: Pool,
  coinInType: string,
  coinOutType: string,
) {
  const availableTokens = Object.keys(pool.pool.coins);
  console.log('Available tokens:', availableTokens);
  console.log('Looking for tokens:', { coinInType, coinOutType });

  // Find matching tokens (case-insensitive and partial match)
  const findToken = (searchToken: string) => {
    return availableTokens.find((token) =>
      token.toLowerCase().includes(searchToken.toLowerCase()),
    );
  };

  const matchedCoinIn = findToken(coinInType);
  const matchedCoinOut = findToken(coinOutType);

  if (!matchedCoinIn || !matchedCoinOut) {
    throw new Error(
      `Tokens not found in pool. Available tokens: ${availableTokens.join(
        ', ',
      )}`,
    );
  }

  console.log('Matched tokens:', { matchedCoinIn, matchedCoinOut });
  return { matchedCoinIn, matchedCoinOut };
}

/**
 * Gets spot price between two tokens in a pool
 * @param poolId - ID of the pool to check prices in
 * @param coinInType - Input token type
 * @param coinOutType - Output token type
 * @param withFees - Whether to include fees in price calculation
 * @returns JSON string containing spot price information
 */
export async function getPoolSpotPrice(
  poolId: string,
  coinInType: string,
  coinOutType: string,
  withFees = true,
): Promise<string> {
  try {
    // Fetch pool and validate tokens
    const pool = await pools.getPool({ objectId: poolId });
    if (!pool) {
      return JSON.stringify([
        handleError('Pool not found', {
          reasoning: 'Pool not found with the specified ID.',
          query: `Attempted to calculate spot price for ${coinInType} to ${coinOutType} in pool ${poolId}`,
        }),
      ]);
    }

    const { matchedCoinIn, matchedCoinOut } = await findTokensInPool(
      pool,
      coinInType,
      coinOutType,
    );
    const spotPrice = pool.getSpotPrice({
      coinInType: matchedCoinIn,
      coinOutType: matchedCoinOut,
      withFees,
    });

    return JSON.stringify([
      {
        reasoning: 'Successfully calculated spot price between tokens.',
        response: JSON.stringify(
          {
            spotPrice,
            coinIn: matchedCoinIn,
            coinOut: matchedCoinOut,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Calculated spot price for ${coinInType} to ${coinOutType} in pool ${poolId}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to calculate spot price',
        query: `Attempted to calculate spot price for ${coinInType} to ${coinOutType} in pool ${poolId}`,
      }),
    ]);
  }
}

/**
 * Gets expected output amount for a trade
 * @param poolId - ID of the pool to trade in
 * @param coinInType - Input token type
 * @param coinOutType - Output token type
 * @param coinInAmount - Amount of input token
 * @param referral - Whether to include referral benefits
 * @returns JSON string containing trade output information
 */
export async function getTradeAmountOut(
  poolId: string,
  coinInType: string,
  coinOutType: string,
  coinInAmount: bigint,
  referral = false,
): Promise<string> {
  try {
    // Fetch pool and validate tokens
    const pool = await pools.getPool({ objectId: poolId });
    if (!pool) {
      return JSON.stringify([
        handleError('Pool not found', {
          reasoning: 'Pool not found with the specified ID.',
          query: `Attempted to calculate output for ${coinInAmount} ${coinInType} to ${coinOutType}`,
        }),
      ]);
    }

    const { matchedCoinIn, matchedCoinOut } = await findTokensInPool(
      pool,
      coinInType,
      coinOutType,
    );
    const amountOut = pool.getTradeAmountOut({
      coinInType: matchedCoinIn,
      coinOutType: matchedCoinOut,
      coinInAmount,
      referral,
    });

    return JSON.stringify([
      {
        reasoning: 'Successfully calculated expected output amount for trade.',
        response: JSON.stringify(
          {
            amountOut: amountOut.toString(),
            coinIn: matchedCoinIn,
            coinOut: matchedCoinOut,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Calculated output amount for ${coinInAmount} ${coinInType} to ${coinOutType}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to calculate trade output amount',
        query: `Attempted to calculate output for ${coinInAmount} ${coinInType} to ${coinOutType}`,
      }),
    ]);
  }
}

/**
 * Gets optimal trade route between tokens
 * @param coinInType - Input token type
 * @param coinOutType - Output token type
 * @param coinInAmount - Amount of input token
 * @returns JSON string containing trade route information
 */
export async function getTradeRoute(
  coinInType: string,
  coinOutType: string,
  coinInAmount: bigint,
): Promise<string> {
  try {
    const router = af.Router();
    // Search for tokens across all pools
    const allPools = await pools.getAllPools();
    let matchedCoinIn = coinInType;
    let matchedCoinOut = coinOutType;

    // Find first pool containing both tokens
    for (const pool of allPools) {
      try {
        const { matchedCoinIn: foundIn, matchedCoinOut: foundOut } =
          await findTokensInPool(pool, coinInType, coinOutType);
        matchedCoinIn = foundIn;
        matchedCoinOut = foundOut;
        break;
      } catch (e) {
        continue;
      }
    }

    // Calculate optimal route
    const route = await router.getCompleteTradeRouteGivenAmountIn({
      coinInType: matchedCoinIn,
      coinOutType: matchedCoinOut,
      coinInAmount,
    });

    return JSON.stringify([
      {
        reasoning: 'Successfully found trade route between tokens.',
        response: JSON.stringify(
          {
            route,
            coinIn: matchedCoinIn,
            coinOut: matchedCoinOut,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Found trade route for ${coinInAmount} ${coinInType} to ${coinOutType}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to find trade route',
        query: `Attempted to find trade route for ${coinInAmount} ${coinInType} to ${coinOutType}`,
      }),
    ]);
  }
}

/**
 * Generates deposit transaction data for a pool
 * @param poolId - ID of the pool to deposit into
 * @param walletAddress - Address of the depositing wallet
 * @param amountsIn - Map of token addresses to deposit amounts
 * @param slippage - Maximum allowed slippage percentage (0.01 = 1%)
 * @param referrer - Optional referrer address
 * @returns JSON string containing deposit transaction data
 */
export async function getDepositTransaction(
  poolId: string,
  walletAddress: string,
  amountsIn: { [key: string]: bigint },
  slippage = 0.01,
  referrer?: string,
): Promise<string> {
  try {
    // Validate pool exists
    const pool = await pools.getPool({ objectId: poolId });
    if (!pool) {
      return JSON.stringify([
        handleError('Pool not found', {
          reasoning: 'Pool not found with the specified ID.',
          query: `Attempted to generate deposit transaction for pool ${poolId}`,
        }),
      ]);
    }

    // Convert token symbols to full addresses
    const availableTokens = Object.keys(pool.pool.coins);
    const convertedAmountsIn: { [key: string]: bigint } = {};

    // Match and convert token addresses
    for (const [token, amount] of Object.entries(amountsIn)) {
      const matchedToken = availableTokens.find((t) =>
        t.toLowerCase().includes(token.toLowerCase()),
      );
      if (!matchedToken) {
        return JSON.stringify([
          handleError('Token not found', {
            reasoning: `Token ${token} not found in pool`,
            query: `Attempted to find token ${token} in pool ${poolId}`,
          }),
        ]);
      }
      convertedAmountsIn[matchedToken] = amount;
    }

    // Generate deposit transaction
    const tx = await pool.getDepositTransaction({
      walletAddress,
      amountsIn: convertedAmountsIn,
      slippage,
      referrer,
    });

    return JSON.stringify([
      {
        reasoning: 'Successfully generated deposit transaction data.',
        response: JSON.stringify(
          {
            tx,
            convertedAmounts: convertedAmountsIn,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Generated deposit transaction for pool ${poolId}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to generate deposit transaction',
        query: `Attempted to generate deposit transaction for pool ${poolId}`,
      }),
    ]);
  }
}

/**
 * Generates withdrawal transaction data for a pool
 * @param poolId - ID of the pool to withdraw from
 * @param walletAddress - Address of the withdrawing wallet
 * @param amountsOutDirection - Map of token addresses to desired withdrawal amounts
 * @param lpCoinAmount - Amount of LP tokens to burn
 * @param slippage - Maximum allowed slippage percentage (0.01 = 1%)
 * @param referrer - Optional referrer address
 * @returns JSON string containing withdrawal transaction data
 */
export async function getWithdrawTransaction(
  poolId: string,
  walletAddress: string,
  amountsOutDirection: { [key: string]: bigint },
  lpCoinAmount: bigint,
  slippage = 0.01,
  referrer?: string,
): Promise<string> {
  try {
    // Validate pool exists
    const pool = await pools.getPool({ objectId: poolId });
    if (!pool) {
      return JSON.stringify([
        handleError('Pool not found', {
          reasoning: 'Pool not found with the specified ID.',
          query: `Attempted to generate withdraw transaction for pool ${poolId}`,
        }),
      ]);
    }

    // Convert token symbols to full addresses
    const availableTokens = Object.keys(pool.pool.coins);
    const convertedAmountsOut: { [key: string]: bigint } = {};

    // Match and convert token addresses
    for (const [token, amount] of Object.entries(amountsOutDirection)) {
      const matchedToken = availableTokens.find((t) =>
        t.toLowerCase().includes(token.toLowerCase()),
      );
      if (!matchedToken) {
        return JSON.stringify([
          handleError('Token not found', {
            reasoning: `Token ${token} not found in pool`,
            query: `Attempted to find token ${token} in pool ${poolId}`,
          }),
        ]);
      }
      convertedAmountsOut[matchedToken] = amount;
    }

    // Generate withdrawal transaction
    const tx = await pool.getWithdrawTransaction({
      walletAddress,
      amountsOutDirection: convertedAmountsOut,
      lpCoinAmount,
      slippage,
      referrer,
    });

    return JSON.stringify([
      {
        reasoning: 'Successfully generated withdraw transaction data.',
        response: JSON.stringify(
          {
            tx,
            convertedAmounts: convertedAmountsOut,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Generated withdraw transaction for pool ${poolId}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to generate withdraw transaction',
        query: `Attempted to generate withdraw transaction for pool ${poolId}`,
      }),
    ]);
  }
}
