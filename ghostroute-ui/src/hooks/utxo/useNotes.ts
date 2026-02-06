/**
 * React hook for note management
 *
 * Provides access to user's notes with real-time updates:
 * - notes: All notes (spent and unspent)
 * - unspentNotes: Only available notes for spending
 * - totalBalance: Sum of unspent note values
 * - addNote: Save new note to localStorage
 * - markAsSpent: Mark note as consumed in transaction
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Note } from '@/types/utxo/note';
import {
  getNotes as getNotesFromStorage,
  getUnspentNotes as getUnspentNotesFromStorage,
  saveNote as saveNoteToStorage,
  updateNote as updateNoteInStorage,
  markNoteAsSpent as markNoteAsSpentInStorage,
} from '@/services/noteStorage';
import { fetchCommitmentInfo } from '@/services/ghostrouteApi';

export interface UseNotesReturn {
  notes: Note[];
  unspentNotes: Note[];
  totalBalance: bigint;
  addNote: (note: Note) => void;
  updateNote: (commitment: string, updates: Partial<Note>) => void;
  markAsSpent: (commitment: string, txHash?: string) => void;
  refreshNotes: () => void;
  syncLeafIndexFromAPI: () => Promise<void>;
  isLoading: boolean;
}

export function useNotes(): UseNotesReturn {
  const { address } = useAccount();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load notes from localStorage
  const loadNotes = useCallback(() => {
    if (!address) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const loadedNotes = getNotesFromStorage(address);
    setNotes(loadedNotes);
    setIsLoading(false);
  }, [address]);

  // Load on mount and when address changes
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Get unspent notes
  const unspentNotes = useMemo(() => {
    return notes.filter((note) => !note.spent);
  }, [notes]);

  // Calculate total balance (sum of unspent notes)
  const totalBalance = useMemo(() => {
    return unspentNotes.reduce((sum, note) => sum + note.value, 0n);
  }, [unspentNotes]);

  // Add new note
  const addNote = useCallback(
    (note: Note) => {
      if (!address) {
        throw new Error('Cannot add note: wallet not connected');
      }

      try {
        saveNoteToStorage(address, note);
        loadNotes(); // Reload to get updated list
        console.log('[useNotes] ✅ Note saved:', note.commitment.slice(0, 10) + '...');
      } catch (error) {
        console.error('[useNotes] ❌ Failed to save note:', error);
        throw new Error('Failed to save note to localStorage');
      }
    },
    [address, loadNotes]
  );

  // Update note fields
  const updateNote = useCallback(
    (commitment: string, updates: Partial<Note>) => {
      console.log('[useNotes] 🔄 updateNote called:', {
        commitment: commitment.slice(0, 20) + '...',
        updates,
        address,
      });

      if (!address) {
        throw new Error('Cannot update note: wallet not connected');
      }

      try {
        updateNoteInStorage(address, commitment, updates);
        loadNotes(); // Reload to get updated list
        console.log('[useNotes] ✅ Note updated successfully:', commitment.slice(0, 10) + '...', updates);
      } catch (error) {
        console.error('[useNotes] ❌ Failed to update note:', error);
        throw new Error('Failed to update note in localStorage');
      }
    },
    [address, loadNotes]
  );

  // Mark note as spent
  const markAsSpent = useCallback(
    (commitment: string, txHash?: string) => {
      if (!address) {
        throw new Error('Cannot mark note as spent: wallet not connected');
      }

      try {
        markNoteAsSpentInStorage(address, commitment, txHash);
        loadNotes(); // Reload to get updated list
        console.log('[useNotes] ✅ Note marked as spent:', commitment.slice(0, 10) + '...');
      } catch (error) {
        console.error('[useNotes] ❌ Failed to mark note as spent:', error);
        throw new Error('Failed to mark note as spent in localStorage');
      }
    },
    [address, loadNotes]
  );

  // Manual refresh
  const refreshNotes = useCallback(() => {
    loadNotes();
  }, [loadNotes]);

  /**
   * Sync leafIndex from API for notes that are missing it
   *
   * This is a fallback mechanism for notes that lost their leafIndex
   * due to page reload or navigation before transaction confirmation.
   */
  const syncLeafIndexFromAPI = useCallback(async () => {
    if (!address) {
      console.log('[useNotes] Cannot sync: wallet not connected');
      return;
    }

    const notesWithoutIndex = notes.filter(note => note.leafIndex === undefined);

    if (notesWithoutIndex.length === 0) {
      console.log('[useNotes] All notes have leafIndex, no sync needed');
      return;
    }

    console.log(`[useNotes] 📋 Found ${notesWithoutIndex.length} note(s) without leafIndex, syncing from API...`);

    for (const note of notesWithoutIndex) {
      try {
        console.log(`[useNotes] 🔄 Fetching leafIndex for commitment ${note.commitment.slice(0, 20)}...`);

        const info = await fetchCommitmentInfo(note.commitment);

        if (info && info.leafIndex !== undefined) {
          updateNote(note.commitment, { leafIndex: info.leafIndex });
          console.log(`[useNotes] ✅ Updated note ${note.commitment.slice(0, 10)}... with leafIndex: ${info.leafIndex}`);
        } else {
          console.log(`[useNotes] ⏳ Note ${note.commitment.slice(0, 10)}... not yet confirmed on-chain`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[useNotes] ❌ Failed to sync leafIndex for ${note.commitment.slice(0, 10)}:`, error);
      }
    }

    console.log('[useNotes] ✅ Finished syncing leafIndex from API');
  }, [notes, address, updateNote]);

  // Auto-sync on mount and when notes change
  useEffect(() => {
    if (notes.length > 0 && address) {
      const notesWithoutIndex = notes.filter(n => n.leafIndex === undefined);
      if (notesWithoutIndex.length > 0) {
        console.log('[useNotes] 🔄 Auto-syncing notes without leafIndex...');
        syncLeafIndexFromAPI();
      }
    }
  }, [notes.length, address, syncLeafIndexFromAPI]);

  return {
    notes,
    unspentNotes,
    totalBalance,
    addNote,
    updateNote,
    markAsSpent,
    refreshNotes,
    syncLeafIndexFromAPI,
    isLoading,
  };
}
