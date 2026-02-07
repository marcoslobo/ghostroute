'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUTXOMath, useNotes } from '@/hooks/utxo';
import { Note } from '@/types/utxo/note';
import { UTXOMathResult } from '@/types/utxo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface InvestmentFormProps {
  onTransactionReady: (result: UTXOMathResult) => void;
}

export function InvestmentForm({ onTransactionReady }: InvestmentFormProps) {
  const { unspentNotes } = useNotes();
  const availableNotes = unspentNotes;

  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(0);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [preview, setPreview] = useState<UTXOMathResult | null>(null);

  const { calculateUTXO, error } = useUTXOMath();

  const selectedNote = availableNotes[selectedNoteIndex];

  useEffect(() => {
    if (!selectedNote || !investmentAmount) {
      setPreview(null);
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPreview(null);
      return;
    }

    const investmentWei = BigInt(Math.floor(amount * 1e18));

    try {
      const result = calculateUTXO(selectedNote, investmentWei);
      setPreview(result);
    } catch {
      setPreview(null);
    }
  }, [selectedNote, investmentAmount, calculateUTXO]);

  const formatETH = (wei: bigint): string => {
    const eth = Number(wei) / 1e18;
    return eth.toFixed(6);
  };

  const totalBalance = useMemo(() => {
    return availableNotes.reduce((sum, note) => sum + note.value, 0n);
  }, [availableNotes]);

  const handleConfirm = () => {
    if (preview) {
      onTransactionReady(preview);
    }
  };

  if (availableNotes.length === 0) {
    return (
      <Alert variant="warning">
        <p className="text-center">No notes available. Deposit first to create a note.</p>
      </Alert>
    );
  }

  return (
    <Card padding="md">
      <h2 className="text-xl font-semibold mb-4">Invest in Uniswap</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Available Notes</label>
          <select
            value={selectedNoteIndex}
            onChange={(e) => setSelectedNoteIndex(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ghost-cyan focus:border-ghost-cyan"
          >
            {availableNotes.map((note, index) => (
              <option key={index} value={index}>
                {formatETH(note.value)} ETH
              </option>
            ))}
          </select>
          <small className="text-muted-foreground text-sm mt-1 block">
            Total balance: {formatETH(totalBalance)} ETH
          </small>
        </div>

        <Input
          type="number"
          step="0.001"
          min="0"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          placeholder="2.0"
          label="Investment Amount (ETH)"
        />

        {error && (
          <Alert variant="error">
            <span className="text-sm">{error}</span>
          </Alert>
        )}

        {preview && (
          <Card variant="glass" padding="md">
            <h3 className="font-medium mb-2">Transaction Preview</h3>
            <div className="flex justify-between text-sm mb-1">
              <span>Investment:</span>
              <span>{formatETH(preview.investmentAmount)} ETH</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Estimated Gas:</span>
              <span>{formatETH(preview.gasEstimate)} ETH</span>
            </div>
            <div className="flex justify-between text-sm font-medium mb-2">
              <span>Change:</span>
              <span>{formatETH(preview.changeNote.value)} ETH</span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              <span>Commitment: </span>
              <code className="bg-ghost-card px-1 rounded">{preview.changeCommitment.slice(0, 10)}...</code>
            </div>
            <Button
              type="button"
              onClick={handleConfirm}
              className="w-full"
            >
              Confirm Investment
            </Button>
          </Card>
        )}
      </div>
    </Card>
  );
}
