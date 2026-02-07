/**
 * ERC20 Approval Button Component
 *
 * Shows approval status and allows requesting unlimited approval
 * for the Privacy Vault to spend the selected ERC20 token.
 */

'use client';

import React from 'react';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { isETH } from '@/config/tokens';

interface ApprovalButtonProps {
  tokenAddress: string;
  requiredAmount: bigint;
  tokenSymbol: string;
}

export function ApprovalButton({ tokenAddress, requiredAmount, tokenSymbol }: ApprovalButtonProps) {
  const {
    hasSufficientAllowance,
    approve,
    isApproving,
    isWaitingApproval,
    error,
  } = useTokenAllowance(tokenAddress);

  // No approval needed for ETH
  if (isETH(tokenAddress)) return null;

  // Already approved
  if (hasSufficientAllowance(requiredAmount)) {
    return (
      <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
        {tokenSymbol} approved for deposit
      </div>
    );
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => approve()}
        disabled={isApproving || isWaitingApproval}
        className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50 mb-1"
      >
        {isApproving
          ? 'Confirm approval in wallet...'
          : isWaitingApproval
          ? 'Waiting for approval...'
          : `Approve ${tokenSymbol}`}
      </button>
      <p className="text-xs text-gray-500">
        You need to approve the Privacy Vault to spend your {tokenSymbol} before depositing.
      </p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
