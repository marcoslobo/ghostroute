import 'server-only';

const UNISWAP_V4_SUBGRAPH_ENDPOINT = 'https://indexer.dev.hyperindex.xyz/4d6927b/v1/graphql';

export async function fetchSubgraph<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const response = await fetch(UNISWAP_V4_SUBGRAPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    next: {
      revalidate: 60, // Revalidate every 60 seconds
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Subgraph fetch error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch from subgraph: ${response.statusText}`);
  }

  const { data, errors } = await response.json();

  if (errors) {
    console.error('Subgraph GraphQL errors:', errors);
    throw new Error(`GraphQL errors: ${errors.map((err: any) => err.message).join(', ')}`);
  }

  return data;
}

export const GET_MOST_LIQUID_POOLS = `
  query GetMostLiquidPools {
    Pool(limit: 5) {
      id
      currency0
      currency1
      fee
      tickSpacing
      hooks
      liquidity
      tick
    }
  }
`;

// Define a type for the pool data
export type Pool = {
  id: string;
  currency0: string;
  currency1: string;
  fee: string;
  tickSpacing: string;
  hooks: string;
  liquidity: string;
  tick: string;
};

export type GetMostLiquidPoolsResponse = {
  pools: Pool[];
};
