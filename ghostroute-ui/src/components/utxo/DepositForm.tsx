/**
 * Deposit Form Component
 *
 * Allows users to deposit ETH into the Privacy Vault and create a note
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useDeposit } from '@/hooks/utxo/useDeposit';
import { parseEther } from 'viem';

interface DepositFormProps {
  onComplete?: () => void;
}

export function DepositForm({ onComplete }: DepositFormProps) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { deposit, isPending, isConfirming, error } = useDeposit();

  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const formatETH = (wei: bigint): string => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return;
    }

    const amountWei = parseEther(amount);

    const result = await deposit({ amount: amountWei });

    if (result.success) {
      setSuccess(true);
      setAmount('');
      onComplete?.();
    }
  };

  const isProcessing = isPending || isConfirming;

  if (!address) {
    return (
      <div className="p-4 border rounded text-center text-gray-500">
        Connect your wallet to deposit
      </div>
    );
  }

  return (
    <div className="deposit-form p-4 border rounded">
      <h2 className="text-xl font-semibold mb-4">Deposit to Privacy Vault</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount (ETH)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.0"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            autoComplete="off"
          />
          {balance && (
            <small className="text-gray-500">
              Wallet balance: {formatETH(balance.value)} ETH
            </small>
          )}
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {success && (
          <div className="text-green-600 text-sm mb-4 p-2 bg-green-50 rounded">
            ✓ Deposit successful! Note created and saved.
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending
            ? 'Confirm in wallet...'
            : isConfirming
            ? 'Confirming...'
            : 'Deposit'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <p className="font-medium mb-1">What happens next:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>A cryptographic note will be generated</li>
          <li>Your ETH will be deposited into the Privacy Vault</li>
          <li>The note will be saved locally for future use</li>
        </ol>
      </div>
    </div>
  );
}
