import {
  getOrCreateVault,
  getVaultByChainAndAddress,
  updateVaultRoot,
} from '../utils/db.ts';
import { SparseMerkleTree } from '../merkle/tree.ts';
import { Hash } from '../merkle/hasher.ts';

export interface VaultInfo {
  id: string;
  chainId: number;
  vaultAddress: string;
  currentRoot: string | null;
  latestBlockNumber: number;
}

export interface VaultWithTree {
  info: VaultInfo;
  tree: SparseMerkleTree;
}

export class VaultService {
  private vaults: Map<string, VaultInfo> = new Map();
  private trees: Map<string, SparseMerkleTree> = new Map();

  async getOrCreateVault(
    chainId: number,
    vaultAddress: string
  ): Promise<VaultInfo> {
    const cacheKey = `${chainId}:${vaultAddress}`;
    const cached = this.vaults.get(cacheKey);
    if (cached) {
      return cached;
    }

    const vaultId = await getOrCreateVault(chainId, vaultAddress);
    const vault = await getVaultByChainAndAddress(chainId, vaultAddress);

    if (!vault) {
      throw new Error('Failed to retrieve newly created vault');
    }

    const vaultInfo: VaultInfo = {
      id: vault.id,
      chainId,
      vaultAddress,
      currentRoot: vault.current_root,
      latestBlockNumber: vault.latest_block_number,
    };

    this.vaults.set(cacheKey, vaultInfo);
    return vaultInfo;
  }

  async getVault(
    chainId: number,
    vaultAddress: string
  ): Promise<VaultInfo | null> {
    const cacheKey = `${chainId}:${vaultAddress}`;
    const cached = this.vaults.get(cacheKey);
    if (cached) {
      return cached;
    }

    const vault = await getVaultByChainAndAddress(chainId, vaultAddress);
    if (vault) {
      const vaultInfo: VaultInfo = {
        id: vault.id,
        chainId,
        vaultAddress,
        currentRoot: vault.current_root,
        latestBlockNumber: vault.latest_block_number,
      };
      this.vaults.set(cacheKey, vaultInfo);
      return vaultInfo;
    }
    return null;
  }

  getTree(vaultId: string, height: number = 20): SparseMerkleTree {
    let tree = this.trees.get(vaultId);
    if (!tree) {
      tree = new SparseMerkleTree(vaultId, height);
      this.trees.set(vaultId, tree);
    }
    return tree;
  }

  async updateVaultRoot(
    chainId: number,
    vaultAddress: string,
    root: string,
    blockNumber: number
  ): Promise<void> {
    const vault = await this.getOrCreateVault(chainId, vaultAddress);
    await updateVaultRoot(vault.id, root, blockNumber);

    const cacheKey = `${chainId}:${vaultAddress}`;
    const cached = this.vaults.get(cacheKey);
    if (cached) {
      cached.currentRoot = root;
      cached.latestBlockNumber = blockNumber;
    }
  }

  loadTreeFromDatabase(
    vaultId: string,
    storedNodes: Map<string, Map<string, string>>,
    height: number = 20
  ): SparseMerkleTree {
    const tree = new SparseMerkleTree(vaultId, height);

    for (const [levelStr, nodes] of storedNodes) {
      const level = parseInt(levelStr);
      for (const [indexStr, hash] of nodes) {
        const index = BigInt(indexStr);
        tree.insert(index, BigInt('0x' + hash.slice(2)));
      }
    }

    this.trees.set(vaultId, tree);
    return tree;
  }
}

export const vaultService = new VaultService();
