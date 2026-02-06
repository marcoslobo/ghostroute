import { createPublicClient, http, Address, keccak256, encodeAbiParameters, parseAbiItem } from 'viem';
import { defineChain } from 'viem';
import { sepolia } from 'viem/chains';

// Chain definitions
export const unichainSepolia = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://sepolia.unichain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Uniscan',
      url: 'https://sepolia.uniscan.xyz/',
    },
  },
});

// Network configuration for different chains
export type SupportedChainId = 11155111 | 1301; // Sepolia | Unichain Sepolia

export const NETWORK_CONFIG: Record<SupportedChainId, {
  name: string;
  poolManager: Address;
  positionManager: Address;
  stateView: Address;
  universalRouter: Address;
  permit2: Address;
  blockExplorer: string;
  rpcUrl: string;
}> = {
  // Sepolia
  11155111: {
    name: 'Sepolia',
    poolManager: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    positionManager: '0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4',
    stateView: '0xe1dd9c3fa50edb962e442f60dfbc432e24537e4c',
    universalRouter: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    blockExplorer: 'https://sepolia.etherscan.io',
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!,
  },
  // Unichain Sepolia
  1301: {
    name: 'Unichain Sepolia',
    poolManager: '0x00b036b58a818b1bc34d502d3fe730db729e62ac',
    positionManager: '0xf969aee60879c54baaed9f3ed26147db216fd664',
    stateView: '0xc199f1072a74d4e905aba1a84d9a45e2546b6222',
    universalRouter: '0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    blockExplorer: 'https://sepolia.uniscan.xyz',
    rpcUrl: 'https://sepolia.unichain.org',
  },
};

// Default to Sepolia for now (where we created the pool)
export const DEFAULT_CHAIN_ID: SupportedChainId = 11155111;

// Create public clients for each supported chain
export const publicClients: Record<SupportedChainId, ReturnType<typeof createPublicClient>> = {
  11155111: createPublicClient({
    chain: sepolia,
    transport: http(NETWORK_CONFIG[11155111].rpcUrl),
  }),
  1301: createPublicClient({
    chain: unichainSepolia,
    transport: http(NETWORK_CONFIG[1301].rpcUrl),
  }),
};

// Legacy exports for backwards compatibility
export const publicClient = publicClients[DEFAULT_CHAIN_ID];
export const POOL_MANAGER_ADDRESS: Address = NETWORK_CONFIG[DEFAULT_CHAIN_ID].poolManager;
export const POSITION_MANAGER_ADDRESS: Address = NETWORK_CONFIG[DEFAULT_CHAIN_ID].positionManager;
export const V4_ROUTER_ADDRESS: Address = NETWORK_CONFIG[DEFAULT_CHAIN_ID].universalRouter;
export const STATE_VIEW_ADDRESS: Address = NETWORK_CONFIG[DEFAULT_CHAIN_ID].stateView;

// --- ABIs ---
// Extracted from v4-periphery compilation

export const STATE_VIEW_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_poolManager",
        "type": "address",
        "internalType": "contract IPoolManager"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getFeeGrowthGlobals",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      }
    ],
    "outputs": [
      {
        "name": "feeGrowthGlobal0",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "feeGrowthGlobal1",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFeeGrowthInside",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "tickLower",
        "type": "int24",
        "internalType": "int24"
      },
      {
        "name": "tickUpper",
        "type": "int24",
        "internalType": "int24"
      }
    ],
    "outputs": [
      {
        "name": "feeGrowthInside0X128",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "feeGrowthInside1X128",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLiquidity",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      }
    ],
    "outputs": [
      {
        "name": "liquidity",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPositionInfo",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "positionId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "liquidity",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "feeGrowthInside0LastX128",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "feeGrowthInside1LastX128",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPositionInfo",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "tickLower",
        "type": "int24",
        "internalType": "int24"
      },
      {
        "name": "tickUpper",
        "type": "int24",
        "internalType": "int24"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "liquidity",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "feeGrowthInside0LastX128",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "feeGrowthInside1LastX128",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPositionLiquidity",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "positionId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "liquidity",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSlot0",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      }
    ],
    "outputs": [
      {
        "name": "sqrtPriceX96",
        "type": "uint160",
        "internalType": "uint160"
      },
      {
        "name": "tick",
        "type": "int24",
        "internalType": "int24"
      },
      {
        "name": "protocolFee",
        "type": "uint24",
        "internalType": "uint24"
      },
      {
        "name": "lpFee",
        "type": "uint24",
        "internalType": "uint24"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTickBitmap",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "tick",
        "type": "int16",
        "internalType": "int16"
      }
    ],
    "outputs": [
      {
        "name": "tickBitmap",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTickFeeGrowthOutside",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "tick",
        "type": "int24",
        "internalType": "int24"
      }
    ],
    "outputs": [
      {
        "name": "feeGrowthOutside0X128",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "feeGrowthOutside1X128",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTickInfo",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "tick",
        "type": "int24",
        "internalType": "int24"
      }
    ],
    "outputs": [
      {
        "name": "liquidityGross",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "liquidityNet",
        "type": "int128",
        "internalType": "int128"
      },
      {
        "name": "feeGrowthOutside0X128",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "feeGrowthOutside1X128",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTickLiquidity",
    "inputs": [
      {
        "name": "poolId",
        "type": "bytes32",
        "internalType": "PoolId"
      },
      {
        "name": "tick",
        "type": "int24",
        "internalType": "int24"
      }
    ],
    "outputs": [
      {
        "name": "liquidityGross",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "liquidityNet",
        "type": "int128",
        "internalType": "int128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "poolManager",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IPoolManager"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "error",
    "name": "NotPoolManager",
    "inputs": []
  }
];

export const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface PoolKey {
  token0: Address;
  token1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}
export interface PoolData {
  token0: Address;
  token1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
  fullPoolId: `0x${string}`;
  sqrtPriceX96?: bigint; // Added current price
  tick?: number;          // Added current tick
}

// Function to compute the PoolId from a PoolKey
// Based on Uniswap V4 PoolKey hashing
export const getPoolId = ({
  token0,
  token1,
  fee,
  tickSpacing,
  hooks,
}: PoolKey): `0x${string}` => {
  // Ensure token0 is always less than token1 for consistent PoolId generation
  const [adjustedToken0, adjustedToken1] =
    token0 < token1 ? [token0, token1] : [token1, token0];

  const encoded = encodeAbiParameters(
    [
      { type: 'address', name: 'token0' },
      { type: 'address', name: 'token1' },
      { type: 'uint24', name: 'fee' },
      { type: 'int24', name: 'tickSpacing' },
      { type: 'address', name: 'hooks' },
    ],
    [adjustedToken0, adjustedToken1, fee, tickSpacing, hooks]
  );

  return keccak256(encoded);
};

// PoolManager Initialize event ABI
export const POOL_MANAGER_ABI = [
  {
    type: 'event',
    name: 'Initialize',
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: true, name: 'currency0', type: 'address' },
      { indexed: true, name: 'currency1', type: 'address' },
      { indexed: false, name: 'fee', type: 'uint24' },
      { indexed: false, name: 'tickSpacing', type: 'int24' },
      { indexed: false, name: 'hooks', type: 'address' },
      { indexed: false, name: 'sqrtPriceX96', type: 'uint160' },
      { indexed: false, name: 'tick', type: 'int24' },
    ],
  },
] as const;

// Interface for pool data from Initialize events
export interface PoolFromEvent {
  poolId: `0x${string}`;
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
  initialSqrtPriceX96: bigint;
  initialTick: number;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

/**
 * Fetches all pools from Initialize events on the PoolManager contract
 * Uses chunked requests to work with RPC providers that have block range limits
 * @param chainId The chain ID to fetch pools from
 * @param fromBlock Starting block number (default: last 50k blocks)
 * @returns Array of pools discovered from events
 */
export const fetchPoolsFromEvents = async (
  chainId: SupportedChainId = DEFAULT_CHAIN_ID,
  fromBlock?: bigint
): Promise<PoolFromEvent[]> => {
  const config = NETWORK_CONFIG[chainId];
  const client = publicClients[chainId];

  if (!client) {
    console.error(`[fetchPoolsFromEvents] No client for chainId ${chainId}`);
    return [];
  }

  try {
    const currentBlock = await client.getBlockNumber();
    const startBlock = fromBlock ?? (currentBlock > BigInt(500) ? currentBlock - BigInt(500) : BigInt(0));

    // Chunk size of 1000 blocks to stay under RPC limits
    const CHUNK_SIZE = BigInt(10);
    const allLogs: any[] = [];

    console.log(`[fetchPoolsFromEvents] Fetching Initialize events from block ${startBlock} to ${currentBlock} on ${config.name}`);

    // Fetch logs in chunks
    let chunkStart = startBlock;
    while (chunkStart <= currentBlock) {
      const chunkEnd = chunkStart + CHUNK_SIZE > currentBlock ? currentBlock : chunkStart + CHUNK_SIZE;

      try {
        const logs = await client.getLogs({
          address: config.poolManager,
          event: parseAbiItem('event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)'),
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        });

        allLogs.push(...logs);
      } catch (chunkError) {
        console.warn(`[fetchPoolsFromEvents] Error fetching chunk ${chunkStart}-${chunkEnd}:`, chunkError);
      }

      chunkStart = chunkEnd + BigInt(1);
    }

    console.log(`[fetchPoolsFromEvents] Found ${allLogs.length} Initialize events`);

    const pools: PoolFromEvent[] = allLogs.map((log) => ({
      poolId: log.args.id as `0x${string}`,
      currency0: log.args.currency0 as Address,
      currency1: log.args.currency1 as Address,
      fee: Number(log.args.fee),
      tickSpacing: Number(log.args.tickSpacing),
      hooks: log.args.hooks as Address,
      initialSqrtPriceX96: log.args.sqrtPriceX96 as bigint,
      initialTick: Number(log.args.tick),
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));

    return pools;
  } catch (error) {
    console.error(`[fetchPoolsFromEvents] Error fetching events:`, error);
    return [];
  }
};

// Zero address represents native ETH in Uniswap V4
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Fetches token info (symbol, decimals) from an ERC20 contract
 * Returns ETH info for the zero address (native ETH)
 */
export const fetchTokenInfo = async (
  tokenAddress: Address,
  chainId: SupportedChainId = DEFAULT_CHAIN_ID
): Promise<{ symbol: string; decimals: number }> => {
  // Handle native ETH (zero address)
  if (tokenAddress.toLowerCase() === ZERO_ADDRESS) {
    return { symbol: 'ETH', decimals: 18 };
  }

  const client = publicClients[chainId];

  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }) as Promise<string>,
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }) as Promise<number>,
    ]);

    return { symbol, decimals: Number(decimals) };
  } catch (error) {
    console.warn(`[fetchTokenInfo] Could not fetch token info for ${tokenAddress}:`, error);
    // Return placeholder based on address
    return {
      symbol: `TKN${tokenAddress.slice(2, 6).toUpperCase()}`,
      decimals: 18,
    };
  }
};

/**
 * Fetches current pool state (sqrtPriceX96, tick, liquidity) from StateView
 */
export const fetchPoolState = async (
  poolId: `0x${string}`,
  chainId: SupportedChainId = DEFAULT_CHAIN_ID
): Promise<{ sqrtPriceX96: bigint; tick: number; liquidity: bigint } | null> => {
  const config = NETWORK_CONFIG[chainId];
  const client = publicClients[chainId];

  try {
    const [slot0Result, liquidityResult] = await Promise.all([
      client.readContract({
        address: config.stateView,
        abi: STATE_VIEW_ABI,
        functionName: 'getSlot0',
        args: [poolId],
      }),
      client.readContract({
        address: config.stateView,
        abi: STATE_VIEW_ABI,
        functionName: 'getLiquidity',
        args: [poolId],
      }),
    ]);

    const slot0 = slot0Result as [bigint, number, number, number];
    return {
      sqrtPriceX96: slot0[0],
      tick: Number(slot0[1]),
      liquidity: liquidityResult as bigint,
    };
  } catch (error) {
    console.warn(`[fetchPoolState] Could not fetch state for pool ${poolId}:`, error);
    return null;
  }
};

// Legacy: Keep HARDCODED_POOL_KEYS empty for backwards compatibility
export const HARDCODED_POOL_KEYS: PoolKey[] = [];

/**
 * Generates the full Uniswap V4 PoolId and returns the PoolKey components.
 * It also fetches current price and tick from the StateView contract.
 * @param token0 Address of token0 in the pool.
 * @param token1 Address of token1 in the pool.
 * @param fee Fee tier of the pool (uint24).
 * @param tickSpacing Tick spacing of the pool (int24).
 * @param hooks Address of the hooks contract for the pool.
 * @returns A PoolData object with the fullPoolId, input PoolKey components, current price, and current tick.
 */
export const getPoolData = async ({
  token0,
  token1,
  fee,
  tickSpacing,
  hooks,
}: {
  token0: Address;
  token1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}): Promise<PoolData> => {
  const fullPoolId = getPoolId({ token0, token1, fee, tickSpacing, hooks });

  console.log(`[getPoolData] Generated fullPoolId: ${fullPoolId} for PoolKey: token0=${token0}, token1=${token1}, fee=${fee}, tickSpacing=${tickSpacing}, hooks=${hooks}`);

  let sqrtPriceX96: bigint | undefined;
  let tick: number | undefined;

  if (!publicClient) {
    console.error("[getPoolData] publicClient is not initialized.");
    return {
      token0,
      token1,
      fee,
      tickSpacing,
      hooks,
      fullPoolId,
      sqrtPriceX96: undefined,
      tick: undefined,
    };
  }

  try {
    const slot0Result = await publicClient.readContract({
      address: STATE_VIEW_ADDRESS,
      abi: STATE_VIEW_ABI,
      functionName: 'getSlot0',
      args: [fullPoolId],
    });
    const slot0Data = slot0Result as [bigint, number, number, number];
    sqrtPriceX96 = slot0Data[0];
    tick = slot0Data[1];
    console.log(`[getPoolData] Fetched slot0 for ${fullPoolId}: sqrtPriceX96=${sqrtPriceX96}, tick=${tick}`);
  } catch (error) {
    console.warn(`[getPoolData] Could not fetch slot0 for pool ${fullPoolId}:`, typeof error === 'string' ? error : (error as Error)?.message || error);
  }

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    hooks,
    fullPoolId,
    sqrtPriceX96,
    tick,
  };
};

// Placeholder hook types
interface AddLiquidityParams {
  poolId: string;
  token0: Address;
  token1: Address;
  amount0Desired: bigint;
  amount1Desired: bigint;
}

interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOutMinimum: bigint;
}

// Placeholder for useAddLiquidity hook
// TODO: Implement real liquidity addition via PositionManager
export const useAddLiquidity = () => {
  const addLiquidity = async (params: AddLiquidityParams) => {
    console.warn("useAddLiquidity: This is a placeholder. Params:", params);
    console.warn("To implement: Use PositionManager.modifyLiquidities() with MINT_POSITION action");
    // In a real implementation, this would:
    // 1. Approve tokens to Permit2
    // 2. Approve Permit2 to let PositionManager spend tokens
    // 3. Call PositionManager.modifyLiquidities() with encoded actions
  };
  return { addLiquidity, isPending: false, isSuccess: false, error: null as Error | null };
};

// Placeholder for useSwap hook
// TODO: Implement real swaps via UniversalRouter
export const useSwap = () => {
  const swap = async (params: SwapParams) => {
    console.warn("useSwap: This is a placeholder. Params:", params);
    console.warn("To implement: Use UniversalRouter for token swaps");
    // In a real implementation, this would:
    // 1. Approve tokens to Permit2
    // 2. Call UniversalRouter with swap commands
  };
  return { swap, isPending: false, isSuccess: false, error: null as Error | null };
};
