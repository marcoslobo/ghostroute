'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useAddLiquidity, useSwap, NETWORK_CONFIG, type SupportedChainId } from '@/lib/uniswap-v4';
import { EnrichedPool } from '@/components/UniswapPoolsSection';
import { parseUnits, formatUnits } from 'viem';

interface UniswapV4PoolsClientProps {
  pools: EnrichedPool[];
  chainId?: SupportedChainId;
}

const formatNumber = (num: string): string => {
  const value = parseFloat(num);
  if (isNaN(value)) return num;

  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

const formatSqrtPrice = (sqrtPriceX96: bigint | undefined): string => {
  if (!sqrtPriceX96) return 'N/A';
  // sqrtPriceX96 = sqrt(price) * 2^96
  // price = (sqrtPriceX96 / 2^96)^2
  const Q96 = BigInt(2) ** BigInt(96);
  const priceX192 = sqrtPriceX96 * sqrtPriceX96;
  const price = Number(priceX192) / Number(Q96 * Q96);

  if (price < 0.0001) return price.toExponential(4);
  if (price > 10000) return price.toExponential(4);
  return price.toFixed(6);
};

const formatLiquidity = (liquidity: bigint | undefined): string => {
  if (!liquidity) return 'N/A';
  const value = Number(formatUnits(liquidity, 18));
  return formatNumber(value.toString());
};

const truncateAddress = (address: string, chars = 6): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

const UniswapV4PoolsClient: React.FC<UniswapV4PoolsClientProps> = ({ pools, chainId = 11155111 }) => {
  const { isConnected } = useAccount();
  const {
    addLiquidity,
    isPending: isAddingLiquidity,
    isSuccess: addLiquiditySuccess,
    error: addLiquidityError
  } = useAddLiquidity();
  const {
    swap,
    isPending: isSwapping,
    isSuccess: swapSuccess,
    error: swapError
  } = useSwap();

  const networkConfig = NETWORK_CONFIG[chainId];

  const handleAddLiquidity = async (pool: EnrichedPool) => {
    if (!isConnected) {
      alert('Please connect your wallet to add liquidity.');
      return;
    }
    const amount0Desired = BigInt(parseUnits('0.001', pool.token0.decimals));
    const amount1Desired = BigInt(parseUnits('0.001', pool.token1.decimals));

    await addLiquidity({
      poolId: pool.id,
      token0: pool.token0.id,
      token1: pool.token1.id,
      amount0Desired,
      amount1Desired,
    });
  };

  const handleSwap = async (pool: EnrichedPool) => {
    if (!isConnected) {
      alert('Please connect your wallet to swap.');
      return;
    }
    const amountIn = BigInt(parseUnits('0.0001', pool.token0.decimals));
    const amountOutMinimum = BigInt(parseUnits('0.00005', pool.token1.decimals));

    await swap({
      tokenIn: pool.token0.id,
      tokenOut: pool.token1.id,
      amountIn,
      amountOutMinimum,
    });
  };

  if (pools.length === 0) {
    return null; // Parent component handles empty state
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-card rounded-lg shadow-lg overflow-hidden">
        <thead className="bg-muted text-muted-foreground uppercase text-xs leading-normal">
          <tr>
            <th className="py-3 px-4 text-left">Token Pair</th>
            <th className="py-3 px-4 text-left">Fee</th>
            <th className="py-3 px-4 text-left">Price</th>
            <th className="py-3 px-4 text-left">Tick</th>
            <th className="py-3 px-4 text-left">Liquidity</th>
            <th className="py-3 px-4 text-left">Hooks</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-foreground text-sm font-light">
          {pools.map((pool) => (
            <tr
              key={pool.id}
              className="border-b border-border hover:bg-muted-foreground/[0.05] transition-colors duration-200"
            >
              <td className="py-3 px-4 text-left whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {pool.token0.symbol}/{pool.token1.symbol}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {truncateAddress(pool.token0.id, 4)} / {truncateAddress(pool.token1.id, 4)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-left">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                  {(pool.fee / 10000).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-4 text-left">
                <span className="font-mono text-sm">
                  {formatSqrtPrice(pool.sqrtPriceX96)}
                </span>
              </td>
              <td className="py-3 px-4 text-left">
                <span className="font-mono text-sm">
                  {pool.tick !== undefined ? pool.tick : 'N/A'}
                </span>
              </td>
              <td className="py-3 px-4 text-left">
                <span className="font-mono text-sm">
                  {formatLiquidity(pool.liquidity)}
                </span>
              </td>
              <td className="py-3 px-4 text-left">
                {pool.hooks === '0x0000000000000000000000000000000000000000' ? (
                  <span className="text-muted-foreground text-xs">None</span>
                ) : (
                  <a
                    href={`${networkConfig.blockExplorer}/address/${pool.hooks}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ghost-cyan hover:underline text-xs font-mono"
                  >
                    {truncateAddress(pool.hooks, 4)}
                  </a>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => handleAddLiquidity(pool)}
                    disabled={isAddingLiquidity || !isConnected}
                    title={!isConnected ? 'Connect wallet first' : 'Add liquidity to this pool'}
                  >
                    {isAddingLiquidity ? '...' : '+ Liquidity'}
                  </button>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => handleSwap(pool)}
                    disabled={isSwapping || !isConnected}
                    title={!isConnected ? 'Connect wallet first' : 'Swap tokens'}
                  >
                    {isSwapping ? '...' : 'Swap'}
                  </button>
                  <a
                    href={`${networkConfig.blockExplorer}/tx/${pool.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-1.5 px-3 rounded text-xs transition-colors"
                    title="View pool creation transaction"
                  >
                    View Tx
                  </a>
                </div>
                {(addLiquiditySuccess || swapSuccess) && (
                  <p className="text-green-500 text-xs mt-1">Transaction Successful!</p>
                )}
                {(addLiquidityError || swapError) && (
                  <p className="text-red-500 text-xs mt-1">
                    Failed: {addLiquidityError?.message || swapError?.message}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UniswapV4PoolsClient;
