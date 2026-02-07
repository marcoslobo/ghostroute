import { keccak256, encodePacked } from 'viem';

/**
 * Compute actionHash for pool investment (must match contract implementation)
 * @param poolId - Uniswap v4 pool identifier
 * @param tickLower - Lower tick of LP position
 * @param tickUpper - Upper tick of LP position
 * @param amount0Desired - Token0 amount
 * @param amount1Desired - Token1 amount
 * @returns actionHash as hex string
 */
export function computeActionHash(
  poolId: `0x${string}`,
  tickLower: number,
  tickUpper: number,
  amount0Desired: bigint,
  amount1Desired: bigint
): `0x${string}` {
  return keccak256(
    encodePacked(
      ['bytes32', 'int24', 'int24', 'uint256', 'uint256'],
      [poolId, tickLower, tickUpper, amount0Desired, amount1Desired]
    )
  );
}
