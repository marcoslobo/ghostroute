/**
 * Deposit Form Component
 *
 * Allows users to deposit ETH or ERC20 tokens into the Privacy Vault
 */

'use client';

import React, { useState } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { TokenSelector } from './TokenSelector';
import { ApprovalButton } from './ApprovalButton';
import { useDeposit } from '@/hooks/utxo/useDeposit';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { isETH, ETH_TOKEN_ADDRESS, getTokenInfo } from '@/config/tokens';
import { useWalletClient } from 'wagmi';

interface DepositFormProps {
  onComplete?: () => void;
}

export function DepositForm({ onComplete }: DepositFormProps) {
  const { address, chainId } = useAccount();
  const { data: balance } = useBalance({ address });
  const { deposit, isPending, isConfirming, error } = useDeposit();
  const [token, setToken] = useState(ETH_TOKEN_ADDRESS);
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const { data: walletClient } = useWalletClient();

  console.log('[DepositForm] Render, token:', token, 'chainId:', chainId);

  const tokenInfo = getTokenInfo(token, chainId || 11155111);
  const { balance: tokenBalance, refetch: refetchBalance } = useTokenBalance(token);

  const formatBalance = (wei: bigint): string => {
    if (isETH(token)) {
      return formatEther(wei);
    }
    const decimals = tokenInfo?.decimals ?? 18;
    return (Number(wei) / 10 ** decimals).toFixed(decimals);
  };

  const parseAmount = (value: string): bigint => {
    if (!value) return 0n;
    if (isETH(token)) {
      return parseEther(value);
    }
    const decimals = tokenInfo?.decimals ?? 18;
    const parsed = parseFloat(value);
    return BigInt(Math.floor(parsed * 10 ** decimals));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return;
    }

    const amountWei = parseAmount(amount);

    const result = await deposit({ amount: amountWei, token });

    if (result.success) {
      setSuccess(true);
      setAmount('');
      refetchBalance();
      onComplete?.();
    }
  };

  const isProcessing = isPending || isConfirming;
  const chainIdNum = chainId || 11155111;

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
        <TokenSelector
          chainId={chainIdNum}
          selectedToken={token}
          onSelect={(t) => {
            console.log('[DepositForm] onSelect called with token:', t);
            setToken(t);
          }}
          disabled={isProcessing}
        />

        <div>
          <Input
            type="number"
            step={isETH(token) ? "0.0001" : "0.000001"}
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.0"
            label={`Amount (${isETH(token) ? 'ETH' : tokenInfo?.symbol || 'Token'})`}
            disabled={isProcessing}
          />
          <small className="text-muted-foreground text-sm mt-1 block">
            Wallet balance: {formatBalance(isETH(token) ? balance?.value ?? 0n : tokenBalance)} {isETH(token) ? 'ETH' : tokenInfo?.symbol || ''}
          </small>
        </div>

        {!isETH(token) && amount && (
          <ApprovalButton
            tokenAddress={token}
            requiredAmount={parseAmount(amount)}
            tokenSymbol={tokenInfo?.symbol || 'Token'}
          />
        )}

        {error && (
          <Alert variant="error">
            <span className="text-sm">{error}</span>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <span className="text-sm">Deposit successful! Note created and saved.</span>
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
            : `Deposit ${isETH(token) ? 'ETH' : tokenInfo?.symbol || ''}`}
        </Button>
      </form>

      <Alert variant="info" className="mt-4">
        <div className="text-sm">
          <p className="font-medium mb-1">What happens next:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>A cryptographic note will be generated</li>
            <li>Your {isETH(token) ? 'ETH' : tokenInfo?.symbol || 'tokens'} will be deposited into the Privacy Vault</li>
            <li>The note will be saved locally for future use</li>
          </ol>
        </div>
      </Alert>
    </Card>
  );
}
