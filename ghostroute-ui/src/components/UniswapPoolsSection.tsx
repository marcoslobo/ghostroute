'use client';

import React, { useState, useEffect, useCallback } from 'react';
import UniswapV4PoolsClient from '@/components/UniswapV4PoolsClient';
import {
  loadSavedPools,
  fetchTokenInfo,
  fetchPoolState,
  DEFAULT_CHAIN_ID,
  NETWORK_CONFIG,
  type SupportedChainId,
  calculateTokenReserves,
} from '@/lib/uniswap-v4';
import { Address } from 'viem';
import { DEPOSIT_COMPLETE_EVENT } from '@/hooks/utxo/useDeposit';

// Define a new interface for the enriched pool data
export interface EnrichedPool {
  id: string; // Pool ID (bytes32)
  fullPoolId: `0x${string}`;
  totalValueLockedUSD: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
  volumeUSD: string;
  fee: number;
  feeTier: string;
  tickSpacing: number;
  hooks: Address;
  token0: {
    symbol: string;
    decimals: number;
    id: Address;
  };
  token1: {
    symbol: string;
    decimals: number;
    id: Address;
  };
  sqrtPriceX96?: bigint;
  tick?: number;
  liquidity?: bigint;
  token0Reserve?: bigint;
  token1Reserve?: bigint;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
  chainId: SupportedChainId;
}

interface UniswapPoolsSectionProps {
  chainId?: SupportedChainId;
}

export function UniswapPoolsSection({ chainId = DEFAULT_CHAIN_ID }: UniswapPoolsSectionProps) {
  const [enrichedPools, setEnrichedPools] = useState<EnrichedPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const networkConfig = NETWORK_CONFIG[chainId];

  const loadPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let enrichedPoolsList: EnrichedPool[] = [];

    try {
      console.log(`[UniswapPoolsSection] Loading saved pools from ${networkConfig.name}...`);
      
      // Load saved pools from config
      const poolsFromEvents = await loadSavedPools(chainId);
      console.log(`[UniswapPoolsSection] Found ${poolsFromEvents.length} pools`);

      // Enrich each pool with token info and current state
      for (const pool of poolsFromEvents) {
        try {
          // Fetch token info in parallel
          const [token0Info, token1Info, poolState] = await Promise.all([
            fetchTokenInfo(pool.currency0, chainId),
            fetchTokenInfo(pool.currency1, chainId),
            fetchPoolState(pool.poolId, chainId),
          ]);

          // Calculate token reserves from liquidity and price
          const liquidity = poolState?.liquidity ?? BigInt(0);
          const sqrtPriceX96 = poolState?.sqrtPriceX96 ?? pool.initialSqrtPriceX96;
          const { token0Reserve, token1Reserve } = calculateTokenReserves(liquidity, sqrtPriceX96);

          const enrichedPool: EnrichedPool = {
            id: pool.poolId,
            fullPoolId: pool.poolId,
            fee: pool.fee,
            feeTier: pool.fee.toString(),
            tickSpacing: pool.tickSpacing,
            hooks: pool.hooks,
            token0: {
              symbol: token0Info.symbol,
              decimals: token0Info.decimals,
              id: pool.currency0,
            },
            token1: {
              symbol: token1Info.symbol,
              decimals: token1Info.decimals,
              id: pool.currency1,
            },
            sqrtPriceX96: poolState?.sqrtPriceX96 ?? pool.initialSqrtPriceX96,
            tick: poolState?.tick ?? pool.initialTick,
            liquidity: poolState?.liquidity,
            token0Reserve,
            token1Reserve,
            blockNumber: pool.blockNumber,
            transactionHash: pool.transactionHash,
            chainId,
            totalValueLockedUSD: 'N/A',
            totalValueLockedToken0: 'N/A',
            totalValueLockedToken1: 'N/A',
            volumeUSD: 'N/A',
          };

          enrichedPoolsList.push(enrichedPool);
        } catch (poolError: any) {
          console.error(`[UniswapPoolsSection] Error enriching pool ${pool.poolId}:`, poolError);
        }
      }

      // Sort by block number (newest first)
      enrichedPoolsList.sort((a, b) => Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0))));
      
      setEnrichedPools(enrichedPoolsList);
    } catch (err: any) {
      console.error(`[UniswapPoolsSection] Error fetching pools:`, err);
      setError(err.message || "Unknown error fetching pools.");
    } finally {
      setIsLoading(false);
    }
  }, [chainId, networkConfig.name, refreshTrigger]);

  // Initial load
  useEffect(() => {
    loadPools();
  }, [loadPools, refreshTrigger]);

  // Listen for deposit complete events
  useEffect(() => {
    const handleDepositComplete = () => {
      console.log('[UniswapPoolsSection] 🔄 Deposit complete event detected - refreshing pools');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener(DEPOSIT_COMPLETE_EVENT, handleDepositComplete);
    
    return () => {
      window.removeEventListener(DEPOSIT_COMPLETE_EVENT, handleDepositComplete);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-8 border-2 border-ghost-border/50 shadow-card">
        <div className="text-center p-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-ghost-cyan mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 border-2 border-ghost-border/50 shadow-card">
      <h2 className="text-3xl font-bold mb-2 text-center text-gradient">
        Uniswap V4 Pools
      </h2>
      <p className="text-center text-muted-foreground mb-6">
        Live pools on {networkConfig.name} • {enrichedPools.length} pools found
      </p>

      {error && (
        <div className="text-center p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          Error loading pools: {error}
        </div>
      )}

      {!error && enrichedPools.length === 0 && (
        <div className="text-center p-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
          <p className="mb-2">No Uniswap V4 pools found on {networkConfig.name}.</p>
          <p className="text-sm text-muted-foreground">
            Pools are discovered by querying Initialize events from the PoolManager contract.
          </p>
        </div>
      )}

      <UniswapV4PoolsClient pools={enrichedPools} chainId={chainId} />
    </div>
  );
}
