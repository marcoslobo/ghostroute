/**
 * Hook to check and request ERC20 token approval for the Privacy Vault.
 * Not needed for ETH deposits.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ERC20_ABI } from '@/lib/abis/erc20';
import { getPrivacyVaultAddress } from '@/config/privacy';
import { isETH } from '@/config/tokens';

const MAX_UINT256 = 2n ** 256n - 1n;

export interface UseTokenAllowanceReturn {
  /** Current allowance for the vault */
  allowance: bigint;
  /** Whether the vault has sufficient allowance for the given amount */
  hasSufficientAllowance: (amount: bigint) => boolean;
  /** Request approval for the vault (max uint256 by default) */
  approve: (amount?: bigint) => void;
  /** Whether the approval tx is pending wallet confirmation */
  isApproving: boolean;
  /** Whether we're waiting for the approval tx to confirm on-chain */
  isWaitingApproval: boolean;
  /** Refetch the current allowance */
  refetch: () => void;
  /** Error message if approval failed */
  error: string | null;
}

export function useTokenAllowance(tokenAddress: string): UseTokenAllowanceReturn {
  const { address } = useAccount();
  const vaultAddress = getPrivacyVaultAddress();
  const isNativeETH = isETH(tokenAddress);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Read current allowance
  const {
    data: currentAllowance,
    refetch,
    isLoading: _isLoadingAllowance,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress as `0x${string}`] : undefined,
    query: { enabled: !isNativeETH && !!address && !!vaultAddress },
  });

  // Write approval
  const {
    data: approveHash,
    writeContract,
    isPending: isApproving,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isWaitingApproval, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Refetch allowance after approval succeeds
  if (isApproved) {
    refetch();
  }

  const allowance = isNativeETH ? MAX_UINT256 : ((currentAllowance as bigint) ?? 0n);

  const hasSufficientAllowance = useCallback(
    (amount: bigint): boolean => {
      if (isNativeETH) return true;
      return allowance >= amount;
    },
    [allowance, isNativeETH]
  );

  const approve = useCallback(
    (amount?: bigint) => {
      if (isNativeETH) return; // ETH doesn't need approval
      if (!vaultAddress) {
        setApproveError('Vault address not configured');
        return;
      }

      setApproveError(null);
      const approvalAmount = amount ?? MAX_UINT256;

      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [vaultAddress as `0x${string}`, approvalAmount],
      });
    },
    [isNativeETH, vaultAddress, tokenAddress, writeContract]
  );

  return {
    allowance,
    hasSufficientAllowance,
    approve,
    isApproving,
    isWaitingApproval,
    refetch,
    error: approveError || (writeError?.message ?? null),
  };
}
