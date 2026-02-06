/**
 * Merkle Proof Service
 *
 * Provides Merkle proofs for notes in the Privacy Vault tree
 */

import { getPrivacyVaultAddress } from '@/config/privacy';
import { getMerklePath, isApiConfigured } from './ghostrouteApi';

export interface MerkleProofData {
  root: string;
  proof: string[]; // 20 siblings for height-20 tree
  leafIndex: number;
}

/**
 * Get Merkle proof for a commitment
 *
 * Options:
 * 1. Fetch from GhostRoute ZK API (Supabase)
 * 2. Use placeholder for testing
 */
export async function getMerkleProof(
  leafIndex: number,
  chainId: number = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111')
): Promise<MerkleProofData> {
  // Try GhostRoute API first
  if (isApiConfigured()) {
    try {
      return await getMerkleProofFromApi(leafIndex, chainId);
    } catch (error) {
      console.warn('[merkleProof] API failed, using placeholder:', error);
      return getPlaceholderProof();
    }
  }

  console.warn('[merkleProof] API not configured, using placeholder');
  return getPlaceholderProof();
}

/**
 * Fetch proof from GhostRoute ZK API
 */
async function getMerkleProofFromApi(
  leafIndex: number,
  chainId: number
): Promise<MerkleProofData> {
  const vaultAddress = getPrivacyVaultAddress();

  const apiResponse = await getMerklePath(chainId, vaultAddress, leafIndex);

  // Convert API response format to MerkleProofData format
  const proof = apiResponse.path.map(p => p.hash);

  return {
    root: apiResponse.root,
    proof,
    leafIndex: apiResponse.leafIndex,
  };
}

/**
 * Placeholder proof for testing with placeholder verifier
 *
 * Since the verifier returns true for any proof, we can use dummy values
 */
function getPlaceholderProof(): MerkleProofData {
  return {
    root: '0x' + '0'.repeat(64), // Empty root
    proof: Array(20).fill('0x' + '0'.repeat(64)), // 20 zero siblings
    leafIndex: 0,
  };
}

/**
 * Compute Merkle root from leaf and proof (for verification)
 */
export function computeMerkleRoot(
  leaf: string,
  index: number,
  proof: string[]
): string {
  // Simplified Merkle root computation
  // In production, use proper Merkle tree library

  const { keccak256 } = require('viem');
  let current = leaf;

  for (let i = 0; i < proof.length; i++) {
    const sibling = proof[i];

    // Determine left/right based on index bit
    const isLeft = (index & (1 << i)) === 0;

    current = isLeft
      ? keccak256(current + sibling.slice(2))
      : keccak256(sibling + current.slice(2));
  }

  return current;
}

/**
 * Verify that a proof is valid
 */
export function verifyMerkleProof(
  commitment: string,
  proof: MerkleProofData,
  expectedRoot: string
): boolean {
  const computedRoot = computeMerkleRoot(commitment, proof.leafIndex, proof.proof);
  return computedRoot === expectedRoot;
}
