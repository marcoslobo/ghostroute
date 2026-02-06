'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUTXOMath, useNotes } from '@/hooks/utxo';
import { Note } from '@/types/utxo/note';
import { UTXOMathResult } from '@/types/utxo';

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
      <div className="p-4 border rounded text-center text-gray-500">
        No notes available. Deposit first to create a note.
      </div>
    );
  }

  return (
    <div className="investment-form p-4 border rounded">
      <h2 className="text-xl font-semibold mb-4">Invest in Uniswap</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Available Notes</label>
        <select
          value={selectedNoteIndex}
          onChange={(e) => setSelectedNoteIndex(Number(e.target.value))}
          className="w-full p-2 border rounded"
        >
          {availableNotes.map((note, index) => (
            <option key={index} value={index}>
              {formatETH(note.value)} ETH
            </option>
          ))}
        </select>
        <small className="text-gray-500">Total balance: {formatETH(totalBalance)} ETH</small>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Investment Amount (ETH)</label>
        <input
          type="number"
          step="0.001"
          min="0"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          placeholder="2.0"
          className="w-full p-2 border rounded"
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {preview && (
        <div className="border rounded p-4 mb-4">
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
          <div className="text-xs text-gray-500 mb-3">
            <span>Commitment: </span>
            <code className="bg-gray-100 px-1 rounded">{preview.changeCommitment.slice(0, 10)}...</code>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Confirm Investment
          </button>
        </div>
      )}
    </div>
  );
}
