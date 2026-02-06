/**
 * Simple Hash Chain implementation matching PrivacyVault.sol
 *
 * Contract algorithm:
 * currentRoot = keccak256(abi.encodePacked(currentRoot, commitment))
 *
 * This is NOT a proper Merkle tree - it's an append-only hash chain
 * where each new commitment is hashed with the previous root.
 */

import { keccak256 } from 'npm:viem@2.21.54';

export class HashChain {
  private currentRoot: string;
  private leafCount: number;

  constructor(initialRoot: string = '0x' + '0'.repeat(64)) {
    this.currentRoot = initialRoot;
    this.leafCount = 0;
  }

  /**
   * Get current root
   */
  getRoot(): string {
    return this.currentRoot;
  }

  /**
   * Get leaf count
   */
  getSize(): number {
    return this.leafCount;
  }

  /**
   * Add new commitment (mimics contract's behavior)
   *
   * Solidity: currentRoot = keccak256(abi.encodePacked(currentRoot, commitment))
   */
  addCommitment(commitment: string): void {
    // Ensure both have 0x prefix
    const root = this.currentRoot.startsWith('0x') ? this.currentRoot : `0x${this.currentRoot}`;
    const comm = commitment.startsWith('0x') ? commitment : `0x${commitment}`;

    // Concatenate root + commitment (equivalent to abi.encodePacked)
    const packed = (root + comm.slice(2)) as `0x${string}`;

    // Hash the concatenation
    this.currentRoot = keccak256(packed);
    this.leafCount++;

    console.log('[HashChain] Added commitment:', {
      oldRoot: root.slice(0, 10) + '...',
      commitment: comm.slice(0, 10) + '...',
      newRoot: this.currentRoot.slice(0, 10) + '...',
      leafCount: this.leafCount,
    });
  }

  /**
   * Restore state from database
   */
  restore(root: string, leafCount: number): void {
    this.currentRoot = root.startsWith('0x') ? root : `0x${root}`;
    this.leafCount = leafCount;
  }
}
