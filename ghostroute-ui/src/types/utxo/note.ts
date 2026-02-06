export interface Note {
  commitment: string;
  nullifier?: string;
  value: bigint;
  token: string;
  salt?: Uint8Array;
  leafIndex?: number; // Index in Merkle tree (from deposit transaction)
  createdAt?: Date;
  spent?: boolean;
  spentTxHash?: string;
}

export function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const note = value as Record<string, unknown>;
  return (
    typeof note.commitment === 'string' &&
    typeof note.value === 'bigint' &&
    typeof note.token === 'string'
  );
}
