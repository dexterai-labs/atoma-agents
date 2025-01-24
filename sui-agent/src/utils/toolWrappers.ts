import { TokenBalance } from '../../@types/interface';
import {
  depositIntoTopPools,
  buildMultiPoolWithdrawTx,
} from '../tools/aftermath/PoolTransactionTool';
import {
  getStakingPositions,
  getSuiTvl,
  getAfSuiExchangeRate,
  getStakeTransaction,
} from '../tools/aftermath/staking';
import {
  initSuiClient,
  buildTransferTx,
  buildMultiTransferTx,
  createMergeCoinsTx,
  estimateGas,
} from '../transactions/TransactionTool';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Transaction wrapper functions
async function transferCoinWrapper(
  fromAddress: string,
  toAddress: string,
  tokenType: string,
  amount: string,
): Promise<string> {
  const client = initSuiClient();
  const tx = await buildTransferTx(
    client,
    fromAddress,
    toAddress,
    tokenType,
    BigInt(amount),
  );
  return JSON.stringify([
    {
      reasoning: 'Transfer transaction created successfully',
      response: tx.serialize(),
      status: 'success',
      query: `Transfer ${amount} of ${tokenType} from ${fromAddress} to ${toAddress}`,
      errors: [],
    },
  ]);
}

async function multiTransferWrapper(
  fromAddress: string,
  toAddress: string,
  transfers: TokenBalance[],
): Promise<string> {
  const client = initSuiClient();
  const tx = await buildMultiTransferTx(
    client,
    fromAddress,
    toAddress,
    transfers,
  );
  return JSON.stringify([
    {
      reasoning: 'Multi-transfer transaction created successfully',
      response: tx.serialize(),
      status: 'success',
      query: `Multi-transfer from ${fromAddress} to ${toAddress}`,
      errors: [],
    },
  ]);
}

async function mergeCoinsWrapper(
  coinType: string,
  walletAddress: string,
  maxCoins?: number,
): Promise<string> {
  const client = initSuiClient();
  const tx = await createMergeCoinsTx(
    client,
    coinType,
    walletAddress,
    maxCoins,
  );
  return JSON.stringify([
    {
      reasoning: 'Merge coins transaction created successfully',
      response: tx.serialize(),
      status: 'success',
      query: `Merge ${
        maxCoins || 'all'
      } coins of type ${coinType} for wallet ${walletAddress}`,
      errors: [],
    },
  ]);
}

async function estimateGasWrapper(
  transaction: TransactionBlock,
): Promise<string> {
  const client = initSuiClient();
  const gasEstimate = await estimateGas(client, transaction);
  return JSON.stringify([
    {
      reasoning: 'Gas estimation completed successfully',
      response: gasEstimate.toString(),
      status: 'success',
      query: 'Estimate gas for transaction',
      errors: [],
    },
  ]);
}

// Pool transaction wrapper functions
async function depositTopPoolsWrapper(
  walletAddress: string,
  metric: string,
  amount: string,
  numPools: string,
  slippage: string,
): Promise<string> {
  return depositIntoTopPools(
    walletAddress,
    metric as 'apr' | 'tvl' | 'fees' | 'volume',
    BigInt(amount),
    parseInt(numPools),
    parseFloat(slippage),
  );
}

async function withdrawPoolsWrapper(
  walletAddress: string,
  poolId: string,
  lpAmount: string,
  slippage: string,
): Promise<string> {
  const client = initSuiClient();
  const tx = await buildMultiPoolWithdrawTx(
    client,
    walletAddress,
    [{ poolId, lpAmount: BigInt(lpAmount) }],
    parseFloat(slippage),
  );
  return JSON.stringify([
    {
      reasoning: 'Successfully created withdrawal transaction',
      response: JSON.stringify(
        {
          transaction: tx.serialize(),
        },
        null,
        2,
      ),
      status: 'success',
      query: `Created withdrawal transaction for ${lpAmount} LP tokens from pool ${poolId}`,
      errors: [],
    },
  ]);
}

// Staking wrapper functions
async function getStakingPositionsWrapper(
  walletAddress: string,
): Promise<string> {
  return getStakingPositions(walletAddress);
}

async function getSuiTvlWrapper(): Promise<string> {
  return getSuiTvl();
}

async function getAfSuiExchangeRateWrapper(): Promise<string> {
  return getAfSuiExchangeRate();
}

async function getStakeTransactionWrapper(
  walletAddress: string,
  suiAmount: string,
  validatorAddress: string,
): Promise<string> {
  return getStakeTransaction(
    walletAddress,
    BigInt(suiAmount),
    validatorAddress,
  );
}

export {
  transferCoinWrapper,
  multiTransferWrapper,
  mergeCoinsWrapper,
  estimateGasWrapper,
  depositTopPoolsWrapper,
  withdrawPoolsWrapper,
  getStakingPositionsWrapper,
  getSuiTvlWrapper,
  getAfSuiExchangeRateWrapper,
  getStakeTransactionWrapper,
};
