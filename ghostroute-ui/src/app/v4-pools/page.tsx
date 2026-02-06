'use client';

import { useEffect, useState } from 'react';
import {
  fetchPoolsFromEvents,
  fetchTokenInfo,
  fetchPoolState,
  useAddLiquidity,
  useSwap,
  NETWORK_CONFIG,
  DEFAULT_CHAIN_ID,
  type SupportedChainId,
  type PoolFromEvent
} from '@/lib/uniswap-v4';
import { Address, parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';

interface DisplayPoolData extends PoolFromEvent {
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  currentSqrtPriceX96?: bigint;
  currentTick?: number;
  liquidity?: bigint;
}

export default function V4PoolsPage() {
  const { isConnected } = useAccount();
  const [pools, setPools] = useState<DisplayPoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainId] = useState<SupportedChainId>(DEFAULT_CHAIN_ID);

  const {
    addLiquidity,
    isPending: isAddingLiquidity,
    isSuccess: addLiquiditySuccess,
    error: addLiquidityError,
  } = useAddLiquidity();

  const {
    swap,
    isPending: isSwapping,
    isSuccess: swapSuccess,
    error: swapError,
  } = useSwap();

  const networkConfig = NETWORK_CONFIG[chainId];

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      setError(null);

      try {
        const poolsFromEvents = await fetchPoolsFromEvents(chainId);
        const enrichedPools: DisplayPoolData[] = [];

        for (const pool of poolsFromEvents) {
          try {
            const [token0Info, token1Info, poolState] = await Promise.all([
              fetchTokenInfo(pool.currency0, chainId),
              fetchTokenInfo(pool.currency1, chainId),
              fetchPoolState(pool.poolId, chainId),
            ]);

            enrichedPools.push({
              ...pool,
              token0Symbol: token0Info.symbol,
              token1Symbol: token1Info.symbol,
              token0Decimals: token0Info.decimals,
              token1Decimals: token1Info.decimals,
              currentSqrtPriceX96: poolState?.sqrtPriceX96,
              currentTick: poolState?.tick,
              liquidity: poolState?.liquidity,
            });
          } catch (e) {
            console.warn(`Could not enrich pool ${pool.poolId}:`, e);
          }
        }

        // Sort by block number (newest first)
        enrichedPools.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        setPools(enrichedPools);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch pools');
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [chainId]);

  const handleAddLiquidity = async (pool: DisplayPoolData) => {
    if (!isConnected) {
      alert('Please connect your wallet to add liquidity.');
      return;
    }
    const amount0Desired = BigInt(parseUnits('0.001', pool.token0Decimals));
    const amount1Desired = BigInt(parseUnits('0.001', pool.token1Decimals));

    addLiquidity({
      poolId: pool.poolId,
      token0: pool.currency0,
      token1: pool.currency1,
      amount0Desired,
      amount1Desired,
    });
  };

  const handleSwap = async (pool: DisplayPoolData) => {
    if (!isConnected) {
      alert('Please connect your wallet to swap.');
      return;
    }
    const amountIn = BigInt(parseUnits('0.0001', pool.token0Decimals));
    const amountOutMinimum = BigInt(parseUnits('0.00005', pool.token1Decimals));

    swap({
      tokenIn: pool.currency0,
      tokenOut: pool.currency1,
      amountIn,
      amountOutMinimum,
    });
  };

  const formatPrice = (sqrtPriceX96: bigint | undefined): string => {
    if (!sqrtPriceX96) return 'N/A';
    const Q96 = BigInt(2) ** BigInt(96);
    const priceX192 = sqrtPriceX96 * sqrtPriceX96;
    const price = Number(priceX192) / Number(Q96 * Q96);
    return price.toFixed(6);
  };

  const formatLiquidity = (liquidity: bigint | undefined): string => {
    if (!liquidity) return 'N/A';
    return Number(formatUnits(liquidity, 18)).toFixed(4);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Uniswap V4 Pools</h1>
      <p className="text-muted-foreground mb-4">
        Network: {networkConfig.name} • {pools.length} pools found
      </p>

      {!isConnected && (
        <p className="text-yellow-500 mb-4">Connect your wallet to interact with pools.</p>
      )}

      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-500/10 rounded-lg">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading pools...</p>
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">No V4 pools found on {networkConfig.name}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool) => (
            <div key={pool.poolId} className="border border-border rounded-lg p-4 shadow-md bg-card">
              <h2 className="text-xl font-semibold mb-2">
                {pool.token0Symbol}/{pool.token1Symbol}
              </h2>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><strong>Fee:</strong> {(pool.fee / 10000).toFixed(2)}%</p>
                <p><strong>Tick Spacing:</strong> {pool.tickSpacing}</p>
                <p><strong>Price:</strong> {formatPrice(pool.currentSqrtPriceX96)}</p>
                <p><strong>Tick:</strong> {pool.currentTick ?? 'N/A'}</p>
                <p><strong>Liquidity:</strong> {formatLiquidity(pool.liquidity)}</p>
                <p className="truncate"><strong>Pool ID:</strong> {pool.poolId.slice(0, 10)}...</p>
              </div>
              <div className="mt-4 space-x-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 transition-colors"
                  onClick={() => handleAddLiquidity(pool)}
                  disabled={isAddingLiquidity || !isConnected}
                >
                  {isAddingLiquidity ? 'Adding...' : '+ Liquidity'}
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 transition-colors"
                  onClick={() => handleSwap(pool)}
                  disabled={isSwapping || !isConnected}
                >
                  {isSwapping ? 'Swapping...' : 'Swap'}
                </button>
                <a
                  href={`${networkConfig.blockExplorer}/tx/${pool.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                >
                  View Tx
                </a>
              </div>
              {(addLiquiditySuccess || swapSuccess) && (
                <p className="text-green-500 mt-2 text-sm">Transaction successful!</p>
              )}
              {(addLiquidityError || swapError) && (
                <p className="text-red-500 mt-2 text-sm">
                  Failed: {addLiquidityError?.message || swapError?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
