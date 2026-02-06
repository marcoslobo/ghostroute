import UniswapV4PoolsClient from '@/components/UniswapV4PoolsClient';
import {
  fetchPoolsFromEvents,
  fetchTokenInfo,
  fetchPoolState,
  DEFAULT_CHAIN_ID,
  NETWORK_CONFIG,
  type SupportedChainId,
  type PoolFromEvent
} from '@/lib/uniswap-v4';
import { Address } from 'viem';

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
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
  chainId: SupportedChainId;
}

interface UniswapPoolsSectionProps {
  chainId?: SupportedChainId;
}

export async function UniswapPoolsSection({ chainId = DEFAULT_CHAIN_ID }: UniswapPoolsSectionProps) {
  let enrichedPools: EnrichedPool[] = [];
  let error: string | null = null;

  const networkConfig = NETWORK_CONFIG[chainId];

  try {
    console.log(`[UniswapPoolsSection] Fetching pools from ${networkConfig.name}...`);

    // Fetch pools from Initialize events
    const poolsFromEvents = await fetchPoolsFromEvents(chainId);

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
          blockNumber: pool.blockNumber,
          transactionHash: pool.transactionHash,
          chainId,
          // Placeholder values for TVL and volume (would need subgraph for real data)
          totalValueLockedUSD: 'N/A',
          totalValueLockedToken0: 'N/A',
          totalValueLockedToken1: 'N/A',
          volumeUSD: 'N/A',
        };

        enrichedPools.push(enrichedPool);
      } catch (poolError: any) {
        console.error(`[UniswapPoolsSection] Error enriching pool ${pool.poolId}:`, poolError);
      }
    }

    // Sort by block number (newest first)
    enrichedPools.sort((a, b) => Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0))));

  } catch (err: any) {
    console.error(`[UniswapPoolsSection] Error fetching pools:`, err);
    error = err.message || "Unknown error fetching pools.";
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
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
    </section>
  );
}
