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

interface NotesListProps {
  notes: Note[];
  totalBalance: bigint;
}

export function NotesList({ notes, totalBalance }: NotesListProps) {
  const formatETH = (wei: bigint): string => {
    return (Number(wei) / 1e18).toFixed(6);
  };

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
          Total: <span className="font-bold">{formatETH(totalBalance)} ETH</span>
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
                  <span className="font-medium">{formatETH(note.value)} ETH</span>
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
