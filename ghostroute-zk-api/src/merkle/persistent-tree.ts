import { hashToString, hashTwo, Hash, zeroHash } from './hasher';
import { saveMerkleNode, getMerkleNode } from '../utils/db.ts';

export interface MerkleProof {
  root: string;
  leafIndex: number;
  path: {
    level: number;
    hash: string;
    side: 'left' | 'right';
  }[];
  membership: boolean;
}

export interface MerkleTreeUpdateResult {
  root: string;
  updatedNodes: number;
}

export class PersistentMerkleTree {
  readonly vaultId: string;
  readonly height: number;
  private cachedNodes: Map<string, string> = new Map();

  constructor(vaultId: string, height: number = 20) {
    this.vaultId = vaultId;
    this.height = height;
  }

  private nodeKey(level: number, index: bigint): string {
    return `${level}:${index.toString()}`;
  }

  async insert(leafIndex: bigint, leafValue: Hash): Promise<MerkleTreeUpdateResult> {
    const updatedNodes: string[] = [];
    let currentIndex = leafIndex;
    let currentHash = leafValue;

    for (let level = 0; level <= this.height; level++) {
      const key = this.nodeKey(level, currentIndex);
      const hashStr = hashToString(currentHash);

      this.cachedNodes.set(key, hashStr);
      updatedNodes.push(key);

      if (level < this.height) {
        const siblingIndex = currentIndex ^ BigInt(1);
        const siblingHash = await this.getOrComputeNode(level + 1, siblingIndex);
        currentHash = hashTwo(
          currentIndex % BigInt(2) === BigInt(0) ? currentHash : siblingHash,
          currentIndex % BigInt(2) === BigInt(0) ? siblingHash : currentHash
        );
        currentIndex = currentIndex / BigInt(2);
      }
    }

    for (const nodeKey of updatedNodes) {
      const [levelStr, indexStr] = nodeKey.split(':');
      const level = parseInt(levelStr);
      const index = BigInt(indexStr);
      const hash = this.cachedNodes.get(nodeKey)!;

      await saveMerkleNode(this.vaultId, level, index, hash);
    }

    return {
      root: this.cachedNodes.get(this.nodeKey(this.height, BigInt(0))) || hashToString(zeroHash(this.height)),
      updatedNodes: updatedNodes.length,
    };
  }

  private async getOrComputeNode(
    level: number,
    index: bigint
  ): Promise<Hash> {
    const key = this.nodeKey(level, index);
    const cached = this.cachedNodes.get(key);
    if (cached) {
      return BigInt('0x' + cached.slice(2));
    }

    const fromDb = await getMerkleNode(this.vaultId, level, index);
    if (fromDb) {
      const hash = BigInt('0x' + fromDb.slice(2));
      this.cachedNodes.set(key, fromDb);
      return hash;
    }

    if (level === 0) {
      return BigInt(0);
    }

    const left = await this.getOrComputeNode(level, index * BigInt(2));
    const right = await this.getOrComputeNode(level, index * BigInt(2) + BigInt(1));
    const parent = hashTwo(left, right);

    const parentKey = this.nodeKey(level + 1, index / BigInt(2));
    this.cachedNodes.set(parentKey, hashToString(parent));

    return parent;
  }

  async getRoot(): Promise<string> {
    const root = await getMerkleNode(this.vaultId, this.height, BigInt(0));
    return root || hashToString(zeroHash(this.height));
  }

  async getLeaf(leafIndex: bigint): Promise<Hash | null> {
    const hash = await getMerkleNode(this.vaultId, 0, leafIndex);
    if (!hash) return null;
    return BigInt('0x' + hash.slice(2));
  }

  async getProof(leafIndex: bigint): Promise<MerkleProof> {
    const leafHash = await this.getLeaf(leafIndex);
    const root = await this.getRoot();

    if (!leafHash) {
      return {
        root,
        leafIndex: Number(leafIndex),
        path: [],
        membership: false,
      };
    }

    const path: { level: number; hash: string; side: 'left' | 'right' }[] = [];
    let currentHash = leafHash;
    let currentIndex = leafIndex;

    for (let level = 0; level < this.height; level++) {
      const siblingIndex = currentIndex ^ BigInt(1);
      const siblingHash = await this.getOrComputeNode(level, siblingIndex);
      const siblingHashStr = hashToString(siblingHash);

      const side: 'left' | 'right' = currentIndex % BigInt(2) === BigInt(0) ? 'right' : 'left';

      path.push({
        level: level + 1,
        hash: siblingHashStr,
        side,
      });

      currentHash = side === 'left'
        ? hashTwo(siblingHash, currentHash)
        : hashTwo(currentHash, siblingHash);
      currentIndex = currentIndex / BigInt(2);
    }

    return {
      root,
      leafIndex: Number(leafIndex),
      path,
      membership: true,
    };
  }

  async batchInsert(
    insertions: Map<bigint, Hash>
  ): Promise<MerkleTreeUpdateResult> {
    let totalUpdated = 0;

    for (const [index, value] of insertions) {
      const result = await this.insert(index, value);
      totalUpdated += result.updatedNodes;
    }

    return {
      root: await this.getRoot(),
      updatedNodes: totalUpdated,
    };
  }

  async rollback(toBlockNumber: number): Promise<number> {
    console.log(`Rollback not fully implemented - would revert nodes after block ${toBlockNumber}`);
    return 0;
  }
}

export function createPersistentMerkleTree(
  vaultId: string,
  height: number = 20
): PersistentMerkleTree {
  return new PersistentMerkleTree(vaultId, height);
}
