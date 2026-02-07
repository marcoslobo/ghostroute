/**
 * Hook to read ERC20 token balance for the connected wallet.
 * For ETH, falls back to native balance via useBalance.
 */

'use client';

import { useAccount, useBalance, useReadContract } from 'wagmi';
import { ERC20_ABI } from '@/lib/abis/erc20';
import { isETH } from '@/config/tokens';

export interface UseTokenBalanceReturn {
  balance: bigint;
  isLoading: boolean;
  refetch: () => void;
}

export function useTokenBalance(tokenAddress: string): UseTokenBalanceReturn {
  const { address } = useAccount();
  const isNativeETH = isETH(tokenAddress);

  // Native ETH balance
  const {
    data: ethBalance,
    isLoading: ethLoading,
    refetch: ethRefetch,
  } = useBalance({
    address,
    query: { enabled: isNativeETH && !!address },
  });

  // ERC20 balance
  const {
    data: erc20Balance,
    isLoading: erc20Loading,
    refetch: erc20Refetch,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !isNativeETH && !!address },
  });

  if (isNativeETH) {
    return {
      balance: ethBalance?.value ?? 0n,
      isLoading: ethLoading,
      refetch: ethRefetch,
    };
  }

  return {
    balance: (erc20Balance as bigint) ?? 0n,
    isLoading: erc20Loading,
    refetch: erc20Refetch,
  };
}
