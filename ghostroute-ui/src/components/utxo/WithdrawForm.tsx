/**
 * Withdraw Form Component
 *
 * Allows users to withdraw ETH from Privacy Vault to a recipient address
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWithdraw } from '@/hooks/utxo/useWithdraw';
import { useNotes } from '@/hooks/utxo/useNotes';
import { Note } from '@/types/utxo/note';
import { isAddress } from 'viem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface WithdrawFormProps {
  onComplete?: () => void;
}

export function WithdrawForm({ onComplete }: WithdrawFormProps) {
  const { address } = useAccount();
  const { unspentNotes } = useNotes();
  const { withdraw, calculateWithdraw, isPending, isConfirming, isGeneratingProof, error } = useWithdraw();

  // Filter out notes without leafIndex (they can't be used for withdraws)
  const validNotes = unspentNotes.filter(note => note.leafIndex !== undefined);

  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof calculateWithdraw> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedNote = validNotes[selectedNoteIndex];

  // Calculate preview when inputs change
  useEffect(() => {
    if (!selectedNote || !withdrawAmount) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    const withdrawWei = BigInt(Math.floor(amount * 1e18));

    try {
      const result = calculateWithdraw(selectedNote, withdrawWei);
      setPreview(result);
      setPreviewError(null);
    } catch (err) {
      setPreview(null);
      const message = err instanceof Error ? err.message : 'Failed to calculate withdraw';
      setPreviewError(message);
      console.error('[WithdrawForm] Preview calculation error:', message);
    }
  }, [selectedNote, withdrawAmount, calculateWithdraw]);

  const formatETH = (wei: bigint): string => {
    return (Number(wei) / 1e18).toFixed(6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!selectedNote || !preview || !recipient || !isAddress(recipient)) {
      return;
    }

    const result = await withdraw({
      inputNote: selectedNote,
      withdrawAmount: preview.withdrawAmount,
      recipient: recipient as `0x${string}`,
    });

    if (result.success) {
      setSuccess(true);
      setWithdrawAmount('');
      setRecipient('');
      onComplete?.();
    }
  };

  const isProcessing = isPending || isConfirming || isGeneratingProof;

  if (!address) {
    return (
      <Alert variant="warning">
        <p className="text-center">Connect your wallet to withdraw</p>
      </Alert>
    );
  }

  if (validNotes.length === 0) {
    return (
      <Alert variant="warning">
        <p className="text-center">
          {unspentNotes.length > 0
            ? 'No valid notes available. All notes are missing leafIndex. Please make a new deposit.'
            : 'No notes available. Deposit first to create a note.'}
        </p>
      </Alert>
    );
  }

  return (
    <Card padding="md">
      <h2 className="text-xl font-semibold mb-4">Withdraw from Privacy Vault</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Note Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Select Note</label>
          <select
            value={selectedNoteIndex}
            onChange={(e) => setSelectedNoteIndex(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ghost-cyan focus:border-ghost-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {validNotes.map((note, index) => (
              <option key={index} value={index}>
                {formatETH(note.value)} ETH (LeafIndex: {note.leafIndex})
              </option>
            ))}
          </select>
        </div>

        {/* Withdraw Amount */}
        <Input
          type="number"
          step="0.00001"
          min="0"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="0.5"
          label="Withdraw Amount (ETH)"
          disabled={isProcessing}
        />

        {/* Recipient Address */}
        <Input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          label="Recipient Address"
          className="font-mono text-sm"
          disabled={isProcessing}
          error={recipient && !isAddress(recipient) ? 'Invalid Ethereum address' : undefined}
        />

        {error && (
          <Alert variant="error">
            <span className="text-sm">{error}</span>
          </Alert>
        )}

        {previewError && (
          <Alert variant="warning">
            <span className="text-sm">⚠️ {previewError}</span>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <span className="text-sm">✓ Withdraw successful!</span>
          </Alert>
        )}

        {/* Preview */}
        {preview && (
          <Card variant="glass" padding="md">
            <h3 className="font-medium mb-2">Transaction Preview</h3>
            <div className="flex justify-between text-sm mb-1">
              <span>Withdraw:</span>
              <span className="font-medium">{formatETH(preview.withdrawAmount)} ETH</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Estimated Gas:</span>
              <span>{formatETH(preview.gasEstimate)} ETH</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Change Note:</span>
              <span>{formatETH(preview.changeNote.value)} ETH</span>
            </div>
            {preview.changeNote.value > 0n && (
              <div className="text-xs text-muted-foreground mt-2">
                <span>Change Commitment: </span>
                <code className="bg-ghost-card px-1 rounded">
                  {preview.changeCommitment.slice(0, 10)}...
                </code>
              </div>
            )}
          </Card>
        )}

        <Button
          type="submit"
          variant="destructive"
          disabled={
            isProcessing ||
            !withdrawAmount ||
            parseFloat(withdrawAmount) <= 0 ||
            !recipient ||
            !isAddress(recipient) ||
            !preview
          }
          className="w-full"
        >
          {isGeneratingProof
            ? '⏳ Generating zero-knowledge proof...'
            : isPending
            ? 'Confirm in wallet...'
            : isConfirming
            ? 'Confirming...'
            : 'Withdraw'}
        </Button>

        {isGeneratingProof && (
          <div className="mt-2 text-sm text-muted-foreground text-center animate-pulse">
            This may take 10-30 seconds. Please wait...
          </div>
        )}
      </form>
    </Card>
  );
}
