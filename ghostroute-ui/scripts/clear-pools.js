#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing all saved pools...\n');

// Reset saved-pools.ts to empty array
const template = `import { Address } from 'viem';
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
  // },
];

export const getSavedPoolsByChain = (chainId: SupportedChainId): SavedPoolDefinition[] => {
  return SAVED_POOLS.filter(pool => pool.chainId === chainId);
};
`;

const configPath = path.join(__dirname, '../src/config/saved-pools.ts');

try {
  fs.writeFileSync(configPath, template);
  console.log('✅ All pools cleared from config!');
  console.log('📄 File reset: src/config/saved-pools.ts\n');
  console.log('💡 Run "npm run parse-pools" to add pools again.\n');
} catch (error) {
  console.error('❌ Error clearing pools:', error.message);
  process.exit(1);
}
