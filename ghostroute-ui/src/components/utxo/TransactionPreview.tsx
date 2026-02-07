'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { UTXOMathResult } from '@/types/utxo';
import { useUTXOMath, useNotes } from '@/hooks/utxo';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface TransactionPreviewProps {
  transaction: UTXOMathResult;
  actionType?: string;
  onComplete?: () => void;
}

export function TransactionPreview({ transaction, actionType = 'uniswap-v4-swap', onComplete }: TransactionPreviewProps) {
  const { address } = useAccount();
  const { submitInvestment, isPending, isConfirming, error } = useUTXOMath();
  const { markAsSpent, addNote } = useNotes();

  const formatETH = (wei: bigint): string => {
    const eth = Number(wei) / 1e18;
    return eth.toFixed(6);
  };

  const handleSubmit = async () => {
    const result = await submitInvestment({
      action: actionType,
      inputNotes: transaction.inputNotes,
      outputNotes: transaction.outputNotes,
      changeCommitment: transaction.changeCommitment,
      proof: '0x' as `0x${string}`,
      root: '0x' as `0x${string}`,
      nullifierHash: '0x' as `0x${string}`,
      actionHash: '0x' as `0x${string}`,
      investAmount: transaction.investmentAmount,
      uniswapParams: '0x' as `0x${string}`,
    });

    if (result.success) {
      // Mark input notes as spent
      transaction.inputNotes.forEach((note) =>
        markAsSpent(note.commitment, result.transactionHash)
      );

      // Save change note
      addNote(transaction.changeNote);

      // Callback
      onComplete?.();
    }
  };

  const isProcessing = isPending || isConfirming;

  return (
    <Card padding="md">
      <h3 className="font-medium mb-4">Confirm Transaction</h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Investment Details</h4>
          <div className="flex justify-between text-sm mb-1">
            <span>Amount:</span>
            <span>{formatETH(transaction.investmentAmount)} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Action:</span>
            <span>{actionType}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Change Note</h4>
          <div className="flex justify-between text-sm mb-1">
            <span>Amount:</span>
            <span>{formatETH(transaction.changeNote.value)} ETH</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span>Commitment: </span>
            <code className="bg-ghost-card px-1 rounded break-all">{transaction.changeCommitment}</code>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Gas</h4>
          <div className="flex justify-between text-sm">
            <span>Estimated:</span>
            <span>{formatETH(transaction.gasEstimate)} ETH</span>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            <span className="text-sm">{error}</span>
          </Alert>
        )}

        {!address ? (
          <Alert variant="warning">
            <p className="text-center text-sm">Connect your wallet to submit</p>
          </Alert>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full"
          >
            {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Submit Transaction'}
          </Button>
        )}
      </div>
    </Card>
  );
}
