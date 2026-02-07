import { EnrichedPool } from '@/components/UniswapPoolsSection';
import { Note } from '@/types/utxo/note';
import { ETH_TOKEN_ADDRESS } from '@/config/tokens';

// WETH addresses by chainId
const WETH_ADDRESSES: Record<number, string | undefined> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Mainnet
  11155111: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // Sepolia
};

/**
 * Get WETH address for a given chain
 * @param chainId - Network chain ID
 * @returns WETH address or undefined if not configured
 */
export function getWETHAddress(chainId: number): string | undefined {
  return WETH_ADDRESSES[chainId];
}

/**
 * Check if a note's token is compatible with a pool
 * @param pool - Target Uniswap v4 pool
 * @param note - User's deposited note
 * @returns true if note token matches one of pool's tokens
 */
export function isPoolCompatible(pool: EnrichedPool, note: Note): boolean {
  const noteToken = note.token.toLowerCase();
  const isETH = noteToken === ETH_TOKEN_ADDRESS;
  const weth = getWETHAddress(pool.chainId)?.toLowerCase();

  const poolToken0 = pool.token0.id.toLowerCase();
  const poolToken1 = pool.token1.id.toLowerCase();

  // ETH notes can invest in pools with WETH
  if (isETH && weth) {
    return poolToken0 === weth || poolToken1 === weth;
  }

  // ERC20 notes must match token0 or token1
  return poolToken0 === noteToken || poolToken1 === noteToken;
}

/**
 * Get the investment side for a note in a pool
 * @returns 0 if note matches token0, 1 if token1, -1 if not compatible
 */
export function getInvestmentSide(pool: EnrichedPool, note: Note): 0 | 1 | -1 {
  const noteToken = note.token.toLowerCase();
  const isETH = noteToken === ETH_TOKEN_ADDRESS;
  const weth = getWETHAddress(pool.chainId)?.toLowerCase();

  const poolToken0 = pool.token0.id.toLowerCase();
  const poolToken1 = pool.token1.id.toLowerCase();

  if (isETH && weth) {
    if (poolToken0 === weth) return 0;
    if (poolToken1 === weth) return 1;
    return -1;
  }

  if (poolToken0 === noteToken) return 0;
  if (poolToken1 === noteToken) return 1;
  return -1;
}
