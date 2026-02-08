/**
 * Notes List Component
 *
 * Displays user's notes with balances and status
 */

'use client';

import React from 'react';
import { Note } from '@/types/utxo/note';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { getTokenSymbolDebug as getTokenSymbol, getTokenDecimals } from '@/config/tokens';
import { useAccount } from 'wagmi';

interface NotesListProps {
  notes: Note[];
  totalBalance: bigint;
}

export function NotesList({ notes, totalBalance }: NotesListProps) {
  const { chainId } = useAccount();

  const formatAmount = (wei: bigint, tokenAddress: string): string => {
    const decimals = getTokenDecimals(tokenAddress, chainId || 11155111);
    const divisor = BigInt(10) ** BigInt(decimals);
    return (Number(wei) / Number(divisor)).toFixed(decimals <= 6 ? 6 : 4);
  };

  const getTokenSymbolDisplay = (tokenAddress: string): string => {
    return getTokenSymbol(tokenAddress, chainId || 11155111);
  };

  // Group total balance by token
  const balancesByToken = notes.reduce((acc, note) => {
    if (!note.spent) {
      const token = note.token;
      acc[token] = (acc[token] || BigInt(0)) + note.value;
    }
    return acc;
  }, {} as Record<string, bigint>);

  if (notes.length === 0) {
    return (
      <div className="mt-6">
        <Alert variant="info">
          <p className="text-center">No notes yet. Deposit to create your first note.</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Your Notes ({notes.length})</h3>
        <div className="text-sm">
          Total: 
          {Object.entries(balancesByToken).map(([token, balance]) => (
            <span key={token} className="font-bold ml-2">
              {formatAmount(balance, token)} {getTokenSymbolDisplay(token)}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {notes.map((note, index) => (
          <Card
            key={note.commitment}
            padding="sm"
            variant={note.spent ? 'default' : 'glass'}
            className={note.spent ? 'opacity-60' : ''}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatAmount(note.value, note.token)} {getTokenSymbolDisplay(note.token)}
                  </span>
                  {note.spent && (
                    <span className="text-xs px-2 py-0.5 bg-ghost-card border border-ghost-border rounded">
                      Spent
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Commitment: <code className="bg-ghost-card px-1 rounded">{note.commitment.slice(0, 16)}...</code>
                </div>
                {note.createdAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Created: {note.createdAt.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
