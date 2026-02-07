'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatUnits, parseUnits } from 'viem';
import { EnrichedPool } from '@/components/UniswapPoolsSection';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { usePoolInvestment } from '@/hooks/utxo/usePoolInvestment';
import { useNotes } from '@/hooks/utxo/useNotes';
import { Note } from '@/types/utxo/note';
import { InvestmentPreview, PoolInvestmentResult } from '@/types/utxo/investment';
import { isPoolCompatible } from '@/utils/utxo/poolCompatibility';
import { getTokenDecimals, getTokenSymbol, ETH_TOKEN_ADDRESS } from '@/config/tokens';

interface PoolInvestmentModalProps {
  pool: EnrichedPool;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: PoolInvestmentResult) => void;
}

export function PoolInvestmentModal({ pool, isOpen, onClose, onSuccess }: PoolInvestmentModalProps) {
  const { unspentNotes } = useNotes();
  const { invest, calculateInvestment, isCompatiblePool, isPending, isConfirming, isGeneratingProof, error } = usePoolInvestment();

  // Filter compatible notes for this pool
  const compatibleNotes = unspentNotes.filter((note) => isPoolCompatible(pool, note));

  // State
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(0);
  const [investAmount, setInvestAmount] = useState<string>('');
  const [tickLower, setTickLower] = useState<number>(-887220);
  const [tickUpper, setTickUpper] = useState<number>(887220);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [preview, setPreview] = useState<InvestmentPreview | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<PoolInvestmentResult | null>(null);

  const selectedNote = compatibleNotes[selectedNoteIndex];

  // Default tick range based on pool tick spacing
  useEffect(() => {
    if (pool.tick) {
      const defaultRange = pool.tickSpacing * 10;
      setTickLower(pool.tick - defaultRange);
      setTickUpper(pool.tick + defaultRange);
    }
  }, [pool]);

  // Calculate preview when inputs change
  useEffect(() => {
    if (!selectedNote || !investAmount) {
      setPreview(null);
      setValidationError(null);
      return;
    }

    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) {
      setPreview(null);
      setValidationError('Investment amount must be greater than 0');
      return;
    }

    const decimals = getTokenDecimals(selectedNote.token, pool.chainId);
    const investmentWei = BigInt(Math.floor(amount * 10 ** decimals));

    const result = calculateInvestment(selectedNote, pool, investmentWei, tickLower, tickUpper);
    setPreview(result);
    setValidationError(result.error || null);
  }, [selectedNote, investAmount, tickLower, tickUpper, pool, calculateInvestment]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedNoteIndex(0);
      setInvestAmount('');
      setPreview(null);
      setValidationError(null);
      setSuccessResult(null);
    }
  }, [isOpen]);

  const handleInvest = useCallback(async () => {
    if (!selectedNote || !preview || !preview.isValid) return;

    const decimals = getTokenDecimals(selectedNote.token, pool.chainId);
    const investmentWei = parseUnits(investAmount, decimals);

    const result = await invest({
      inputNote: selectedNote,
      pool,
      investAmount: investmentWei,
      tickLower,
      tickUpper,
    });

    if (result.success) {
      setSuccessResult(result);
      onSuccess?.(result);
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [selectedNote, preview, invest, pool, investAmount, tickLower, tickUpper, onClose, onSuccess]);

  const formatAmount = (value: bigint, token: string): string => {
    const decimals = getTokenDecimals(token, pool.chainId);
    return formatUnits(value, decimals);
  };

  const getTokenSymbolDisplay = (token: string): string => {
    return getTokenSymbol(token, pool.chainId);
  };

  const truncateHash = (hash: string, chars = 6): string => {
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
  };

  if (!isOpen) return null;

  // Success state
  if (successResult) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
          {/* Close button for success state */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors bg-ghost-card/50 hover:bg-ghost-card rounded-full w-8 h-8 flex items-center justify-center"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-500">Investment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your investment has been submitted and is being processed.
            </p>
            <div className="bg-ghost-card rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">Transaction Hash</p>
              <code className="text-ghost-cyan font-mono text-sm">
                {truncateHash(successResult.transactionHash || '')}
              </code>
            </div>
            {successResult.changeNote && (
              <div className="bg-ghost-card rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground">Change Note Created</p>
                <p className="font-medium">
                  {formatAmount(successResult.changeNote.value, successResult.changeNote.token)}{' '}
                  {getTokenSymbolDisplay(successResult.changeNote.token)}
                </p>
              </div>
            )}
            <Button onClick={onClose} variant="secondary" className="w-full">
              Close
            </Button>
          </div>
        </Card>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Invest in Pool</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {pool.token0.symbol}/{pool.token1.symbol} ({(pool.fee / 10000).toFixed(2)}%)
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors bg-ghost-card/50 hover:bg-ghost-card rounded-full w-8 h-8 flex items-center justify-center"
              disabled={isPending || isConfirming || isGeneratingProof}
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* No compatible notes */}
          {compatibleNotes.length === 0 && (
            <Alert variant="warning">
              <p className="font-medium">No compatible notes found</p>
              <p className="text-sm mt-1">
                You need a deposited note with {pool.token0.symbol} or {pool.token1.symbol} to invest in this pool.
              </p>
            </Alert>
          )}

          {/* Note Selector */}
          {compatibleNotes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Note</label>
              <select
                value={selectedNoteIndex}
                onChange={(e) => setSelectedNoteIndex(Number(e.target.value))}
                disabled={isPending || isConfirming || isGeneratingProof}
                className="w-full px-3 py-2 rounded-lg border bg-input text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ghost-cyan focus:border-ghost-cyan disabled:opacity-50"
              >
                {compatibleNotes.map((note, index) => (
                  <option key={index} value={index}>
                    {formatAmount(note.value, note.token)} {getTokenSymbolDisplay(note.token)}
                  </option>
                ))}
              </select>
              <small className="text-muted-foreground text-sm mt-1 block">
                {compatibleNotes.length} compatible note{compatibleNotes.length !== 1 ? 's' : ''} available
              </small>
            </div>
          )}

          {/* Investment Amount */}
          {compatibleNotes.length > 0 && (
            <Input
              type="number"
              step="0.001"
              min="0"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="0.0"
              label={`Investment Amount (${selectedNote ? getTokenSymbolDisplay(selectedNote.token) : 'Token'})`}
              disabled={isPending || isConfirming || isGeneratingProof}
            />
          )}

          {/* Advanced: Tick Range */}
          {compatibleNotes.length > 0 && (
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-ghost-cyan hover:underline flex items-center gap-1"
                disabled={isPending || isConfirming || isGeneratingProof}
              >
                {showAdvanced ? '▼' : '▶'} Advanced: Tick Range
              </button>
              {showAdvanced && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    value={tickLower}
                    onChange={(e) => setTickLower(Number(e.target.value))}
                    label="Tick Lower"
                    disabled={isPending || isConfirming || isGeneratingProof}
                  />
                  <Input
                    type="number"
                    value={tickUpper}
                    onChange={(e) => setTickUpper(Number(e.target.value))}
                    label="Tick Upper"
                    disabled={isPending || isConfirming || isGeneratingProof}
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="error">
              <span className="text-sm">{validationError}</span>
            </Alert>
          )}

          {/* Hook Error */}
          {error && (
            <Alert variant="error">
              <span className="text-sm">{error}</span>
            </Alert>
          )}

          {/* Investment Preview */}
          {preview && preview.isValid && (
            <Card variant="glass" padding="md">
              <h3 className="font-semibold mb-3 text-foreground">Investment Preview</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Input Note:</span>
                  <span>
                    {selectedNote && formatAmount(selectedNote.value, selectedNote.token)}{' '}
                    {selectedNote && getTokenSymbolDisplay(selectedNote.token)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment:</span>
                  <span className="font-medium text-ghost-cyan">
                    {formatAmount(preview.investAmount, selectedNote?.token || '')}{' '}
                    {selectedNote && getTokenSymbolDisplay(selectedNote.token)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Estimate:</span>
                  <span>{formatUnits(preview.gasEstimate, 18)} ETH</span>
                </div>
                {selectedNote && selectedNote.token !== ETH_TOKEN_ADDRESS && (
                  <div className="text-xs text-muted-foreground italic">
                    * Gas paid in ETH from your wallet, not from the {getTokenSymbolDisplay(selectedNote.token)} note
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Change Note:</span>
                  <span className="font-medium">
                    {formatAmount(preview.changeNote.value, selectedNote?.token || '')}{' '}
                    {selectedNote && getTokenSymbolDisplay(selectedNote.token)}
                  </span>
                </div>
              </div>

              {/* Action Hash */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Action Hash:</span>
                  <code className="text-xs font-mono text-ghost-cyan bg-ghost-card px-2 py-1 rounded">
                    {truncateHash(preview.actionHash)}
                  </code>
                </div>
              </div>

              {/* Pool Info */}
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Pool ID:</span>
                <code className="font-mono">{truncateHash(pool.fullPoolId)}</code>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Tick Range:</span>
                <span>
                  [{tickLower}, {tickUpper}]
                </span>
              </div>
            </Card>
          )}

          {/* Confirm Button */}
          {compatibleNotes.length > 0 && (
            <Button
              onClick={handleInvest}
              disabled={!preview?.isValid || isPending || isConfirming || isGeneratingProof}
              className="w-full"
              size="lg"
            >
              {isGeneratingProof ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚙</span>
                  Generating Proof...
                </span>
              ) : isConfirming ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Confirming...
                </span>
              ) : isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Pending...
                </span>
              ) : (
                'Confirm Investment'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>,
    document.body
  );
}
