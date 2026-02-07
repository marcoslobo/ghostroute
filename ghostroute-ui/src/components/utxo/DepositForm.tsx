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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

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
      <Alert variant="warning">
        <p className="text-center">Connect your wallet to deposit</p>
      </Alert>
    );
  }

  return (
    <Card padding="md">
      <h2 className="text-xl font-semibold mb-4">Deposit to Privacy Vault</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="number"
            step="0.0001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.0"
            label="Amount (ETH)"
            disabled={isProcessing}
          />
          {balance && (
            <small className="text-muted-foreground text-sm mt-1 block">
              Wallet balance: {formatETH(balance.value)} ETH
            </small>
          )}
        </div>

        {error && (
          <Alert variant="error">
            <span className="text-sm">{error}</span>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <span className="text-sm">✓ Deposit successful! Note created and saved.</span>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {isPending
            ? 'Confirm in wallet...'
            : isConfirming
            ? 'Confirming...'
            : 'Deposit'}
        </Button>
      </form>

      <Alert variant="info" className="mt-4">
        <div className="text-sm">
          <p className="font-medium mb-1">What happens next:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>A cryptographic note will be generated</li>
            <li>Your ETH will be deposited into the Privacy Vault</li>
            <li>The note will be saved locally for future use</li>
          </ol>
        </div>
      </Alert>
    </Card>
  );
}
