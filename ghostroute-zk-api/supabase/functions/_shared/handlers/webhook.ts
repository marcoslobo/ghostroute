import { getOrCreateVault } from '../utils/db.ts';
import { vaultService } from './events.ts';
import { createLeafHash, Hash } from '../merkle/hasher.ts';
import { SparseMerkleTree } from '../merkle/tree.ts';

export interface NewCommitmentPayload {
  eventId: string;
  chainId: number;
  vaultAddress: string;
  commitment: {
    hash: string;
    index: number;
    value: string;
    metadata?: string;
  };
  block: {
    number: number;
    hash: string;
    timestamp: number;
  };
  transactionHash: string;
}

export interface NullifierSpentPayload {
  eventId: string;
  chainId: number;
  vaultAddress: string;
  nullifier: {
    hash: string;
    commitmentIndex: number;
  };
  block: {
    number: number;
    hash: string;
    timestamp: number;
  };
  transactionHash: string;
}

export type WebhookPayload = NewCommitmentPayload | NullifierSpentPayload;

export function isNewCommitment(
  payload: WebhookPayload
): payload is NewCommitmentPayload {
  return 'commitment' in payload && payload.commitment !== undefined;
}

export function isNullifierSpent(
  payload: WebhookPayload
): payload is NullifierSpentPayload {
  return 'nullifier' in payload && payload.nullifier !== undefined;
}

export function validateNewCommitment(payload: NewCommitmentPayload): void {
  if (!payload.eventId || typeof payload.eventId !== 'string') {
    throw new Error('Invalid eventId');
  }
  if (typeof payload.chainId !== 'number' || payload.chainId < 0) {
    throw new Error('Invalid chainId');
  }
  if (!payload.vaultAddress || !/^0x[a-fA-F0-9]{40}$/.test(payload.vaultAddress)) {
    throw new Error('Invalid vaultAddress');
  }
  if (!payload.commitment?.hash || !/^0x[a-fA-F0-9]{64}$/.test(payload.commitment.hash)) {
    throw new Error('Invalid commitment hash');
  }
  if (typeof payload.commitment?.index !== 'number' || payload.commitment.index < 0) {
    throw new Error('Invalid commitment index');
  }
  if (!payload.block?.number || typeof payload.block.number !== 'number') {
    throw new Error('Invalid block number');
  }
}

export function validateNullifierSpent(payload: NullifierSpentPayload): void {
  if (!payload.eventId || typeof payload.eventId !== 'string') {
    throw new Error('Invalid eventId');
  }
  if (typeof payload.chainId !== 'number' || payload.chainId < 0) {
    throw new Error('Invalid chainId');
  }
  if (!payload.vaultAddress || !/^0x[a-fA-F0-9]{40}$/.test(payload.vaultAddress)) {
    throw new Error('Invalid vaultAddress');
  }
  if (!payload.nullifier?.hash || !/^0x[a-fA-F0-9]{64}$/.test(payload.nullifier.hash)) {
    throw new Error('Invalid nullifier hash');
  }
  if (typeof payload.nullifier?.commitmentIndex !== 'number') {
    throw new Error('Invalid commitment index');
  }
  if (!payload.block?.number || typeof payload.block.number !== 'number') {
    throw new Error('Invalid block number');
  }
}

export async function handleNewCommitment(
  payload: NewCommitmentPayload
): Promise<{ success: boolean; root: string | null }> {
  const vault = await vaultService.getOrCreateVault(
    payload.chainId,
    payload.vaultAddress
  );

  const tree = vaultService.getTree(vault.id);

  const commitmentHash = BigInt('0x' + payload.commitment.hash.slice(2));
  const leafIndex = BigInt(payload.commitment.index);
  const leafHash = createLeafHash(commitmentHash, leafIndex);

  tree.insert(leafIndex, leafHash);

  await vaultService.updateVaultRoot(
    payload.chainId,
    payload.vaultAddress,
    tree.root,
    payload.block.number
  );

  return {
    success: true,
    root: tree.root,
  };
}

export async function handleNullifierSpent(
  payload: NullifierSpentPayload
): Promise<{ success: boolean }> {
  const vault = await vaultService.getOrCreateVault(
    payload.chainId,
    payload.vaultAddress
  );

  console.log(`Nullifier spent for vault ${vault.id}: ${payload.nullifier.hash}`);

  return {
    success: true,
  };
}
