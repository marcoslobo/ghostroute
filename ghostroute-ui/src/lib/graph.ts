import 'server-only';

const GRAPH_API_KEY = process.env.NEXT_PUBLIC_UNISWAP_V4_GRAPH_API_KEY;

if (!GRAPH_API_KEY) {
  throw new Error(
    "NEXT_PUBLIC_UNISWAP_V4_GRAPH_API_KEY is not defined. Please set it in your .env.local file."
  );
}

const UNISWAP_V4_SUBGRAPH_ENDPOINT = `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/aa3YpP—pS4Kit`;

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

// export const GET_MOST_LIQUID_POOLS = `
//   query GetMostLiquidPools {
//     pools(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
//       id
//       feeTier
//       tickSpacing
//       hooks
//       token0 {
//         symbol
//         decimals
//         id
//       }
//       token1 {
//         symbol
//         decimals
//         id
//       }
//       totalValueLockedUSD
//       totalValueLockedToken0
//       totalValueLockedToken1
//       volumeUSD
//     }
//   }
// `;

// // Define a type for the pool data
// export type Pool = {
//   id: string;
//   feeTier: string;
//   tickSpacing: number;
//   hooks: string;
//   token0: {
//     symbol: string;
//     decimals: number;
//     id: string;
//   };
//   token1: {
//     symbol: string;
//     decimals: number;
//     id: string;
//   };
//   totalValueLockedUSD: string;
//   totalValueLockedToken0: string;
//   totalValueLockedToken1: string;
//   volumeUSD: string;
// };

// export type GetMostLiquidPoolsResponse = {
//   pools: Pool[];
// };
