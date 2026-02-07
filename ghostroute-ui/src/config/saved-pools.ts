import { Address } from 'viem';
import { SupportedChainId } from '@/lib/uniswap-v4';

export interface SavedPoolDefinition {
  token0: Address;
  token1: Address;
  fee: number;           // uint24 (e.g., 3000 for 0.3%)
  tickSpacing: number;   // int24
  hooks: Address;
  label?: string;        // Optional display label
  chainId: SupportedChainId;
}

export const SAVED_POOLS: SavedPoolDefinition[] = [
// Pools will be added here by parse-pool-output.js
  // Or you can manually add pools in this format:
  // {
  //   token0: '0x...',
  //   token1: '0x...',
  //   fee: 3000,
  //   tickSpacing: 60,
  //   hooks: '0x0000000000000000000000000000000000000000',
  //   label: 'My Pool',
  //   chainId: 11155111,
  // },,
  // Pool: 0x10a85f83d5060642499685cd29c8ac5626b427b26080b5fe7e511d9c0e2e7528
  {
    token0: '0x081414da0a90387a9c223579229d2828415ccF0a' as Address,
    token1: '0xF5CFf6Cccfe0690f712b7A017a4a69Fb1B5B7c35' as Address,
    fee: 3000,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000' as Address,
    chainId: 11155111,
  },
  // Pool: 0x10a85f83d5060642499685cd29c8ac5626b427b26080b5fe7e511d9c0e2e7528
  {
    token0: '0xa4c974F12CfA33a3Ab567a89d3bF1e708189cd0e' as Address,
    token1: '0xaf3ED8eA2a765b84Dfcd9f37e9edb2FE23c58067' as Address,
    fee: 3000,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000' as Address,
    chainId: 11155111,
  },
  // Pool: 0x7b42a2e45826ba52db3fc623145171e6a4b32566cef885187d8cf9f9a6c38980
  {
    token0: '0x6866492d8ed5792A981Fdaf1aDC45c617cA5b690' as Address,
    token1: '0xcA284396DF82C1AdC1d6970cBAFED547078c39E1' as Address,
    fee: 3000,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000' as Address,
    chainId: 11155111,
  },
  // Pool: 0x62e2b64f427201f01c26a3345012599bec65117c02ef43ffc7efefbe407d23d2
  {
    token0: '0x00BCFD2D9944eF6dB19Af8C098bA90F9c367c499' as Address,
    token1: '0x02fED5fbcdd64046a6af8804aDCd6A27C278D0B6' as Address,
    fee: 3000,
    tickSpacing: 10,
    hooks: '0x0000000000000000000000000000000000000000' as Address,
    chainId: 11155111,
  }
];

export const getSavedPoolsByChain = (chainId: SupportedChainId): SavedPoolDefinition[] => {
  return SAVED_POOLS.filter(pool => pool.chainId === chainId);
};
