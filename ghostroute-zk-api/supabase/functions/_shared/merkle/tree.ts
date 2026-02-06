import { SMT, checkHex } from 'https://esm.sh/@zk-kit/smt@1.0.2';
import { hashTwo, hashFour, HashString, hashToString } from './hasher.ts';

export interface MerkleProof {
  root: HashString;
  leafIndex: number;
  path: {
    level: number;
    hash: HashString;
    side: 'left' | 'right';
  }[];
  membership: boolean;
}

export interface MerkleTreeInterface {
  readonly height: number;
  readonly root: HashString;
  readonly size: number;

  insert(leafIndex: bigint, value: bigint): void;
  update(leafIndex: bigint, newValue: bigint): void;
  delete(leafIndex: bigint): void;
  getProof(leafIndex: bigint): MerkleProof;
  getRoot(): HashString;
  getLeaf(leafIndex: bigint): bigint | null;
}

function bigintHash(inputs: string[]): string {
  if (!inputs || inputs.length < 2) {
    return '0'.repeat(64);
  }
  
  // Convert all inputs to BigInt safely
  const values = inputs.slice(0, 4).map(v => {
    const str = (v || '0').replace(/^0x/, '');
    return BigInt('0x' + str);
  });
  
  // Hash based on number of inputs
  if (values.length === 2) {
    const result = hashTwo(values[0], values[1]);
    return result.toString(16).padStart(64, '0');
  }
  if (values.length === 3) {
    // For 3 inputs, hash first two, then with third
    const intermediate = hashTwo(values[0], values[1]);
    const result = hashTwo(intermediate, values[2]);
    return result.toString(16).padStart(64, '0');
  }
  if (values.length === 4) {
    const result = hashFour(values[0], values[1], values[2], values[3]);
    return result.toString(16).padStart(64, '0');
  }
  
  // Fallback: hash first two
  const result = hashTwo(values[0], values[1]);
  return result.toString(16).padStart(64, '0');
}

export class SparseMerkleTree implements MerkleTreeInterface {
  readonly height: number;
  readonly vaultId: string;
  private tree: SMT;
  private leafCount: number;

  constructor(vaultId: string, height: number = 20) {
    this.height = height;
    this.vaultId = vaultId;
    this.leafCount = 0;
    this.tree = new SMT(bigintHash, false);
  }

  get root(): HashString {
    return this.tree.root;
  }

  get size(): number {
    return this.leafCount;
  }

  insert(leafIndex: bigint, value: bigint): void {
    const key = leafIndex.toString(16).padStart(64, '0');
    const val = value.toString(16).padStart(64, '0');
    this.tree.add(key, val);
    this.leafCount = Math.max(Number(leafIndex) + 1, this.leafCount);
  }

  update(leafIndex: bigint, newValue: bigint): void {
    const key = leafIndex.toString(16).padStart(64, '0');
    const val = hashToString(newValue);
    this.tree.update(key, val);
  }

  delete(leafIndex: bigint): void {
    const key = leafIndex.toString(16).padStart(64, '0');
    this.tree.delete(key);
  }

  getProof(leafIndex: bigint): MerkleProof {
    const key = leafIndex.toString(16).padStart(64, '0');
    const proof = this.tree.createProof(key);
    const root = this.tree.root;

    const path = proof.siblings.map((sibling: string | undefined, idx: number) => {
      const bit = (leafIndex >> BigInt(idx)) & 1n;
      return {
        level: idx + 1,
        hash: sibling || '0'.repeat(64),
        side: bit === 0n ? 'left' : 'right' as 'left' | 'right',
      };
    });

    return {
      root: root,
      leafIndex: Number(leafIndex),
      path,
      membership: proof.membership,
    };
  }

  getRoot(): HashString {
    return this.tree.root;
  }

  getLeaf(leafIndex: bigint): bigint | null {
    const key = leafIndex.toString(16).padStart(64, '0');
    const value = this.tree.get(key);
    if (!value) return null;
    return BigInt('0x' + value);
  }

  static fromLeaves(
    vaultId: string,
    leaves: Map<bigint, bigint>,
    height: number = 20
  ): SparseMerkleTree {
    const tree = new SparseMerkleTree(vaultId, height);
    for (const [index, value] of leaves) {
      tree.insert(index, value);
    }
    return tree;
  }
}

export function createEmptyMerkleTree(
  vaultId: string,
  height: number = 20
): SparseMerkleTree {
  return new SparseMerkleTree(vaultId, height);
}

export function computeRootFromPath(
  leafIndex: bigint,
  leafValue: bigint,
  path: { level: number; hash: Hash; side: 'left' | 'right' }[]
): bigint {
  let current = leafValue;

  for (const sibling of path) {
    if (sibling.side === 'left') {
      current = hashTwo(sibling.hash, current);
    } else {
      current = hashTwo(current, sibling.hash);
    }
  }

  return current;
}

export function verifyMerkleProof(
  leafIndex: bigint,
  leafValue: bigint,
  root: HashString,
  proof: MerkleProof
): boolean {
  const computedRoot = computeRootFromPath(
    leafIndex,
    leafValue,
    proof.path.map((p) => ({
      level: p.level,
      hash: stringToHash(p.hash),
      side: p.side,
    }))
  );

  return computedRoot === stringToHash(proof.root);
}

function stringToHash(str: HashString): bigint {
  if (!str.startsWith('0x')) {
    str = '0x' + str;
  }
  return BigInt(str);
}
