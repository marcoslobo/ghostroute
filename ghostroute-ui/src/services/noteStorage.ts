/**
 * localStorage-based note management service
 *
 * Stores user notes client-side for privacy. Notes include:
 * - commitment: Poseidon hash of (value, token, salt)
 * - nullifier: Unique identifier preventing double-spend
 * - value: Amount in wei (bigint stored as string)
 * - token: Token address (ETH = 0x0000...)
 * - salt: Random 32-byte salt (Uint8Array stored as hex)
 * - spent: Whether note has been consumed
 */

import { Note } from '@/types/utxo/note';

// Storage format for serialization
interface StoredNote {
  commitment: string;
  nullifier?: string;
  value: string; // bigint as string
  token: string;
  salt: string; // Uint8Array as hex string
  leafIndex?: number; // Index in Merkle tree
  createdAt: string; // ISO date
  spent: boolean;
  spentTxHash?: string;
}

/**
 * Get localStorage key for user's notes
 */
function getStorageKey(address: string): string {
  return `ghostroute_notes_${address.toLowerCase()}`;
}

/**
 * Convert Uint8Array to hex string
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const matches = cleaned.match(/.{1,2}/g);
  if (!matches) return new Uint8Array();
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Serialize note for storage
 */
function serializeNote(note: Note): StoredNote {
  return {
    commitment: note.commitment,
    nullifier: note.nullifier,
    value: note.value.toString(),
    token: note.token,
    salt: note.salt ? bufferToHex(note.salt) : '',
    leafIndex: note.leafIndex,
    createdAt: note.createdAt ? note.createdAt.toISOString() : new Date().toISOString(),
    spent: note.spent || false,
    spentTxHash: note.spentTxHash,
  };
}

/**
 * Deserialize note from storage
 */
function deserializeNote(stored: StoredNote): Note {
  return {
    commitment: stored.commitment,
    nullifier: stored.nullifier,
    value: BigInt(stored.value),
    token: stored.token,
    salt: stored.salt ? hexToBuffer(stored.salt) : undefined,
    leafIndex: stored.leafIndex,
    createdAt: stored.createdAt ? new Date(stored.createdAt) : undefined,
    spent: stored.spent || false,
    spentTxHash: stored.spentTxHash,
  };
}

/**
 * Load all notes from localStorage
 */
export function getNotes(address: string): Note[] {
  if (typeof window === 'undefined') return []; // SSR safety

  const key = getStorageKey(address);
  const data = localStorage.getItem(key);

  if (!data) return [];

  try {
    const stored: StoredNote[] = JSON.parse(data);
    return stored.map(deserializeNote);
  } catch (error) {
    console.error('[noteStorage] Failed to parse notes:', error);
    return [];
  }
}

/**
 * Get only unspent notes
 */
export function getUnspentNotes(address: string): Note[] {
  return getNotes(address).filter((note) => !note.spent);
}

/**
 * Save note to localStorage
 */
export function saveNote(address: string, note: Note): void {
  if (typeof window === 'undefined') return; // SSR safety

  const existing = getNotes(address);

  // Check for duplicate commitments
  const duplicate = existing.find((n) => n.commitment === note.commitment);
  if (duplicate) {
    console.warn('[noteStorage] Duplicate note commitment:', note.commitment);
    return;
  }

  // Add new note
  const updated = [...existing, note];
  const serialized = updated.map(serializeNote);

  const key = getStorageKey(address);
  localStorage.setItem(key, JSON.stringify(serialized));
}

/**
 * Update note fields (e.g., add leafIndex after deposit confirms)
 */
export function updateNote(
  address: string,
  commitment: string,
  updates: Partial<Note>
): void {
  if (typeof window === 'undefined') return; // SSR safety

  const notes = getNotes(address);
  const updated = notes.map((note) => {
    if (note.commitment === commitment) {
      return {
        ...note,
        ...updates,
      };
    }
    return note;
  });

  const serialized = updated.map(serializeNote);
  const key = getStorageKey(address);
  localStorage.setItem(key, JSON.stringify(serialized));
}

/**
 * Mark note as spent
 */
export function markNoteAsSpent(
  address: string,
  commitment: string,
  txHash?: string
): void {
  if (typeof window === 'undefined') return; // SSR safety

  const notes = getNotes(address);
  const updated = notes.map((note) => {
    if (note.commitment === commitment) {
      return {
        ...note,
        spent: true,
        spentTxHash: txHash,
      };
    }
    return note;
  });

  const serialized = updated.map(serializeNote);
  const key = getStorageKey(address);
  localStorage.setItem(key, JSON.stringify(serialized));
}

/**
 * Delete all notes for address (for testing/debugging)
 */
export function clearNotes(address: string): void {
  if (typeof window === 'undefined') return;

  const key = getStorageKey(address);
  localStorage.removeItem(key);
}

/**
 * Export notes as JSON for backup
 */
export function exportNotes(address: string): string {
  const notes = getNotes(address);
  return JSON.stringify(notes.map(serializeNote), null, 2);
}

/**
 * Import notes from JSON backup
 */
export function importNotes(address: string, json: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored: StoredNote[] = JSON.parse(json);
    const notes = stored.map(deserializeNote);

    // Merge with existing notes (no duplicates)
    const existing = getNotes(address);
    const commitments = new Set(existing.map((n) => n.commitment));

    const newNotes = notes.filter((note) => !commitments.has(note.commitment));
    const merged = [...existing, ...newNotes];

    const serialized = merged.map(serializeNote);
    const key = getStorageKey(address);
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch (error) {
    console.error('[noteStorage] Failed to import notes:', error);
    throw new Error('Invalid backup format');
  }
}
