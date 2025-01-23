import { Aftermath } from 'aftermath-ts-sdk';
import { PoolInfo } from '../../../@types/interface';
import { handleError } from '../../utils';

// Initialize Aftermath SDK for mainnet
const af = new Aftermath('MAINNET');
const pools = af.Pools();

// Type definitions for pool operations
type RankingMetric = 'apr' | 'tvl' | 'fees' | 'volume';
type SortOrder = 'asc' | 'desc';

/**
 * Processes raw pool data into standardized format
 * @param pool - Raw pool data from Aftermath
 * @param poolId - Unique identifier for the pool
 * @returns Standardized pool information
 */
async function processPool(pool: any, poolId: string): Promise<PoolInfo> {
  try {
    const metrics = await pools.getPoolsStats({ poolIds: [poolId] });
    const poolMetrics = metrics[0];

    // Extract token information
    const tokens = Object.keys(pool.pool.coins || {});
    const reserves = tokens.map((token) => {
      const coinData = pool.pool.coins[token];
      return BigInt(coinData.normalizedBalance || 0);
    });

    return {
      id: poolId,
      tokens,
      reserves,
      fee: poolMetrics?.fees || 0,
      tvl: poolMetrics?.tvl || 0,
      apr: (poolMetrics?.apr || 0) * 100,
    };
  } catch (error: unknown) {
    console.error(`Error processing pool ${poolId}:`, error);
    return {
      id: poolId,
      tokens: [],
      reserves: [],
      fee: 0,
      tvl: 0,
      apr: 0,
    };
  }
}

/**
 * Gets detailed information about a specific pool
 * @param poolId - Unique identifier for the pool
 * @returns JSON string containing pool details or error information
 */
export async function getPool(poolId: string): Promise<string> {
  try {
    const pool = await pools.getPool({ objectId: poolId });
    if (!pool) {
      return JSON.stringify([
        handleError('Pool not found', {
          reasoning: 'Pool not found with the specified ID.',
          query: `Attempted to fetch pool with ID: ${poolId}`,
        }),
      ]);
    }
    const processedPool = await processPool(pool, poolId);
    return JSON.stringify([
      {
        reasoning:
          'Successfully retrieved pool information from Aftermath Finance.',
        response: JSON.stringify(processedPool, null, 2),
        status: 'success',
        query: `Fetched pool with ID: ${poolId}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to retrieve pool information',
        query: `Attempted to fetch pool with ID: ${poolId}`,
      }),
    ]);
  }
}

/**
 * Retrieves information about all available pools
 * @returns JSON string containing all pool information
 */
export async function getAllPools(): Promise<string> {
  try {
    const allPools = await pools.getAllPools();
    const processedPools = await Promise.all(
      allPools.map(async (pool) => {
        if (!pool.pool?.objectId) return null;
        return processPool(pool, pool.pool.objectId);
      }),
    );

    const validPools = processedPools.filter(
      (pool): pool is PoolInfo => pool !== null && pool.tokens.length > 0,
    );

    return JSON.stringify([
      {
        reasoning:
          'Successfully retrieved all available pools from Aftermath Finance.',
        response: JSON.stringify(validPools, null, 2),
        status: 'success',
        query: 'Fetched all available pools',
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to retrieve pool information',
        query: 'Attempted to fetch all available pools',
      }),
    ]);
  }
}

/**
 * Gets deposit or withdrawal events for a specific pool
 * @param poolId - Unique identifier for the pool
 * @param eventType - Type of events to fetch ("deposit" or "withdraw")
 * @param limit - Maximum number of events to return
 * @returns JSON string containing event information
 */
export async function getPoolEvents(
  poolId: string,
  eventType: 'deposit' | 'withdraw',
  limit = 10,
): Promise<string> {
  try {
    const pool = await pools.getPool({ objectId: poolId });
    if (!pool) {
      return JSON.stringify([
        handleError('Pool not found', {
          reasoning: 'Pool not found with the specified ID.',
          query: `Attempted to fetch ${eventType} events for pool: ${poolId}`,
        }),
      ]);
    }

    const eventData =
      eventType === 'deposit'
        ? await pool.getDepositEvents({ limit })
        : await pool.getWithdrawEvents({ limit });

    return JSON.stringify([
      {
        reasoning: `Successfully retrieved ${eventType} events for the pool.`,
        response: JSON.stringify(eventData, null, 2),
        status: 'success',
        query: `Fetched ${eventType} events for pool: ${poolId}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: `Failed to retrieve ${eventType} events`,
        query: `Attempted to fetch ${eventType} events for pool: ${poolId}`,
      }),
    ]);
  }
}

/**
 * Calculates pool APR based on volume and TVL
 * @param pool - Pool data containing volume and TVL information
 * @returns Calculated APR as a percentage
 */
export function calculatePoolApr(pool: any): number {
  try {
    // Convert values from base units
    const volume24h = Number(pool.pool.volume24h || 0) / 1e9;
    const tvl = Number(pool.pool.lpCoinSupply || 0) / 1e9;
    if (tvl === 0) return 0;

    // Calculate annual revenue and APR
    const feeRate = Number(pool.pool.flatness || 0) / 1e9;
    const feeRevenue24h = volume24h * feeRate;
    const annualRevenue = feeRevenue24h * 365;
    return (annualRevenue / tvl) * 100;
  } catch (error) {
    console.error('Error calculating pool APR:', error);
    return 0;
  }
}

/**
 * Gets ranked pools by specified metric
 * @param metric - Metric to rank by (apr, tvl, fees, volume)
 * @param limit - Maximum number of pools to return
 * @param order - Sort order (ascending or descending)
 * @returns JSON string containing ranked pool information
 */
export async function getRankedPools(
  metric: RankingMetric = 'tvl',
  limit = 10,
  order: SortOrder = 'desc',
): Promise<string> {
  try {
    // Fetch and process all pools
    const allPools = await pools.getAllPools();
    const processedPools = await Promise.all(
      allPools.map(async (pool) => {
        if (!pool.pool?.objectId) return null;
        return processPool(pool, pool.pool.objectId);
      }),
    );

    const validPools = processedPools.filter(
      (pool): pool is PoolInfo => pool !== null && pool.tokens.length > 0,
    );

    // Sort pools based on the specified metric
    const sortedPools = validPools.sort((a, b) => {
      let valueA: number, valueB: number;

      switch (metric) {
        case 'apr':
          valueA = a.apr;
          valueB = b.apr;
          break;
        case 'tvl':
          valueA = a.tvl;
          valueB = b.tvl;
          break;
        case 'fees':
          valueA = a.fee;
          valueB = b.fee;
          break;
        case 'volume':
          valueA = a.tvl * a.fee; // Using TVL * fee as a proxy for volume
          valueB = b.tvl * b.fee;
          break;
        default:
          valueA = a.tvl;
          valueB = b.tvl;
      }

      return order === 'desc' ? valueB - valueA : valueA - valueB;
    });

    // Take only the requested number of pools
    const topPools = sortedPools.slice(0, limit);

    // Format the response with ranking information
    const rankedPools = topPools.map((pool, index) => ({
      rank: index + 1,
      ...pool,
      metrics: {
        apr: `${pool.apr.toFixed(2)}%`,
        tvl: `$${pool.tvl.toLocaleString()}`,
        fee: `${(pool.fee * 100).toFixed(2)}%`,
        volume: `$${(pool.tvl * pool.fee).toLocaleString()}`, // Estimated volume
      },
    }));

    return JSON.stringify([
      {
        reasoning: `Successfully retrieved top ${limit} pools ranked by ${metric}.`,
        response: JSON.stringify(
          {
            metric,
            order,
            pools: rankedPools,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Retrieved top ${limit} pools ranked by ${metric} in ${order}ending order`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to retrieve ranked pools',
        query: `Attempted to fetch top ${limit} pools ranked by ${metric}`,
      }),
    ]);
  }
}

/**
 * Gets pools filtered by specific criteria
 * @param minTvl - Minimum Total Value Locked requirement
 * @param minApr - Minimum Annual Percentage Rate requirement
 * @param tokens - Array of token symbols that must be in the pool
 * @returns JSON string containing filtered pool information
 */
export async function getFilteredPools(
  minTvl?: number,
  minApr?: number,
  tokens?: string[],
): Promise<string> {
  try {
    // Fetch and process all pools
    const allPools = await pools.getAllPools();
    const processedPools = await Promise.all(
      allPools.map(async (pool) => {
        if (!pool.pool?.objectId) return null;
        return processPool(pool, pool.pool.objectId);
      }),
    );

    // Apply filters
    const filteredPools = processedPools.filter((pool): pool is PoolInfo => {
      if (!pool || pool.tokens.length === 0) return false;

      // Apply TVL filter
      if (minTvl && pool.tvl < minTvl) return false;

      // Apply APR filter
      if (minApr && pool.apr < minApr) return false;

      // Apply token filter
      if (tokens) {
        const poolTokens = pool.tokens.map((t) => t.toLowerCase());
        const hasRequiredTokens = tokens.every((token) =>
          poolTokens.some((poolToken) =>
            poolToken.includes(token.toLowerCase()),
          ),
        );
        if (!hasRequiredTokens) return false;
      }

      return true;
    });

    // Format the response with detailed metrics
    const formattedPools = filteredPools.map((pool) => ({
      ...pool,
      metrics: {
        apr: `${pool.apr.toFixed(2)}%`,
        tvl: `$${pool.tvl.toLocaleString()}`,
        fee: `${(pool.fee * 100).toFixed(2)}%`,
        volume: `$${(pool.tvl * pool.fee).toLocaleString()}`, // Estimated volume
      },
    }));

    return JSON.stringify([
      {
        reasoning:
          'Successfully retrieved pools matching the specified criteria.',
        response: JSON.stringify(
          {
            filters: {
              minTvl,
              minApr,
              tokens,
            },
            poolCount: formattedPools.length,
            pools: formattedPools,
          },
          null,
          2,
        ),
        status: 'success',
        query: `Retrieved pools with${minTvl ? ` min TVL $${minTvl}` : ''}${
          minApr ? ` min APR ${minApr}%` : ''
        }${tokens ? ` containing tokens ${tokens.join(', ')}` : ''}`,
        errors: [],
      },
    ]);
  } catch (error: unknown) {
    return JSON.stringify([
      handleError(error, {
        reasoning: 'Failed to retrieve filtered pools',
        query: 'Attempted to fetch filtered pools',
      }),
    ]);
  }
}
