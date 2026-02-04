import { fetchSubgraph, GET_MOST_LIQUID_POOLS, GetMostLiquidPoolsResponse } from '@/lib/graph';
import UniswapV4PoolsClient from '@/components/UniswapV4PoolsClient';

export async function UniswapPoolsSection() {
  let pools = [];
  let error: string | null = null;

  try {
    const data = await fetchSubgraph<GetMostLiquidPoolsResponse>(GET_MOST_LIQUID_POOLS);
    pools = data?.pools || [];
  } catch (err: any) {
    console.error("Failed to fetch Uniswap V4 pools:", err);
    error = err.message || "Unknown error fetching pools.";
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center text-gradient">Uniswap V4 - Most Liquid Pools</h2>
      {error ? (
        <div className="text-center p-4 text-red-500">Error loading pools: {error}</div>
      ) : (
        <UniswapV4PoolsClient pools={pools} />
      )}
    </>
  );
}
