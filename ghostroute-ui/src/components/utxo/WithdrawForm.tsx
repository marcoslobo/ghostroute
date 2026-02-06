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
      <div className="p-4 border rounded text-center text-gray-500">
        Connect your wallet to withdraw
      </div>
    );
  }

  if (validNotes.length === 0) {
    return (
      <div className="p-4 border rounded text-center text-gray-500">
        {unspentNotes.length > 0
          ? 'No valid notes available. All notes are missing leafIndex. Please make a new deposit.'
          : 'No notes available. Deposit first to create a note.'}
      </div>
    );
  }

  return (
    <div className="withdraw-form p-4 border rounded">
      <h2 className="text-xl font-semibold mb-4">Withdraw from Privacy Vault</h2>

      <form onSubmit={handleSubmit}>
        {/* Note Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Note</label>
          <select
            value={selectedNoteIndex}
            onChange={(e) => setSelectedNoteIndex(Number(e.target.value))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Withdraw Amount (ETH)</label>
          <input
            type="number"
            step="0.00001"
            min="0"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.5"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            autoComplete="off"
          />
        </div>

        {/* Recipient Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border rounded font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
            autoComplete="off"
          />
          {recipient && !isAddress(recipient) && (
            <small className="text-red-500">Invalid Ethereum address</small>
          )}
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {previewError && (
          <div className="text-orange-600 text-sm mb-4 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
            ⚠️ {previewError}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm mb-4 p-2 bg-green-50 rounded">
            ✓ Withdraw successful!
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="border rounded p-4 mb-4 bg-gray-50">
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
              <div className="text-xs text-gray-500 mt-2">
                <span>Change Commitment: </span>
                <code className="bg-gray-100 px-1 rounded">
                  {preview.changeCommitment.slice(0, 10)}...
                </code>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            isProcessing ||
            !withdrawAmount ||
            parseFloat(withdrawAmount) <= 0 ||
            !recipient ||
            !isAddress(recipient) ||
            !preview
          }
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isGeneratingProof
            ? '⏳ Generating zero-knowledge proof...'
            : isPending
            ? 'Confirm in wallet...'
            : isConfirming
            ? 'Confirming...'
            : 'Withdraw'}
        </button>

        {isGeneratingProof && (
          <div className="mt-2 text-sm text-gray-600 text-center animate-pulse">
            This may take 10-30 seconds. Please wait...
          </div>
        )}
      </form>
    </div>
  );
}
