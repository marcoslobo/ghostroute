import { hashToString, Hash, hashTwo, hashFour } from './hasher';
import { getMerkleNode, saveMerkleNode } from '../utils/db.ts';

export interface MerklePathElement {
  level: number;
  hash: string;
  side: 'left' | 'right';
}

export interface MerkleProof {
  root: string;
  leafIndex: number;
  path: MerklePathElement[];
  membership: boolean;
}

export interface MerklePathServiceInterface {
  getProof(vaultId: string, leafIndex: bigint): Promise<MerkleProof>;
  computePath(
    vaultId: string,
    leafIndex: bigint,
    leafHash: Hash
  ): Promise<MerklePathElement[]>;
}

export class MerklePathService implements MerklePathServiceInterface {
  readonly height: number = 20;

  async getProof(vaultId: string, leafIndex: bigint): Promise<MerkleProof> {
    const leafHash = await this.getLeaf(vaultId, leafIndex);

    if (!leafHash) {
      return {
        root: '',
        leafIndex: Number(leafIndex),
        path: [],
        membership: false,
      };
    }

    const path = await this.computePath(vaultId, leafIndex, leafHash);
    const root = await this.getRoot(vaultId);

    return {
      root,
      leafIndex: Number(leafIndex),
      path,
      membership: true,
    };
  }

  async computePath(
    vaultId: string,
    leafIndex: bigint,
    leafHash: Hash
  ): Promise<MerklePathElement[]> {
    const path: MerklePathElement[] = [];
    let currentHash = leafHash;

    for (let level = 0; level < this.height; level++) {
      const bit = (leafIndex >> BigInt(level)) & BigInt(1);
      const siblingIndex = bit === BigInt(0)
        ? leafIndex + BigInt(1) << BigInt(level)
        : leafIndex - BigInt(1) << BigInt(level);

      let siblingHash = await getMerkleNode(vaultId, level, siblingIndex);

      if (!siblingHash) {
        siblingHash = await this.getZeroHash(vaultId, level);
      }

      const side: 'left' | 'right' = bit === BigInt(0) ? 'right' : 'left';

      path.push({
        level: level + 1,
        hash: siblingHash,
        side,
      });

      if (side === 'left') {
        currentHash = hashTwo(siblingHash, currentHash);
      } else {
        currentHash = hashTwo(currentHash, siblingHash);
      }
    }

    return path;
  }

  private async getLeaf(vaultId: string, leafIndex: bigint): Promise<Hash | null> {
    const hashStr = await getMerkleNode(vaultId, 0, leafIndex);
    if (!hashStr) return null;
    return BigInt('0x' + hashStr.slice(2));
  }

  private async getRoot(vaultId: string): Promise<string> {
    const rootHash = await getMerkleNode(vaultId, this.height, BigInt(0));
    return rootHash || hashToString(BigInt(0));
  }

  private async getZeroHash(vaultId: string, level: number): Promise<string> {
    const cached = await getMerkleNode(vaultId, level, BigInt(0));
    if (cached) return cached;

    let zeroHash = BigInt(0);
    for (let i = 0; i <= level; i++) {
      zeroHash = hashTwo(zeroHash, zeroHash);
    }

    const hashStr = hashToString(zeroHash);
    await saveMerkleNode(vaultId, level, BigInt(0), hashStr);
    return hashStr;
  }
}

export const merklePathService = new MerklePathService();
