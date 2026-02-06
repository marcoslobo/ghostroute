/**
 * Notes List Component
 *
 * Displays user's notes with balances and status
 */

'use client';

import React from 'react';
import { Note } from '@/types/utxo/note';

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
      <div className="mt-6 p-4 border rounded text-center text-gray-500">
        No notes yet. Deposit to create your first note.
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
          <div
            key={note.commitment}
            className={`p-3 border rounded ${
              note.spent ? 'bg-gray-50 opacity-60' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatETH(note.value)} ETH</span>
                  {note.spent && (
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">Spent</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Commitment: <code className="bg-gray-100 px-1 rounded">{note.commitment.slice(0, 16)}...</code>
                </div>
                {note.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    Created: {note.createdAt.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
