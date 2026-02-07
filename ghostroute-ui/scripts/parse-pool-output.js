#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🪄 Pool Parser - "Moedor de Carne"\n');

// Check if pool-output.txt exists
const outputFilePath = path.join(process.cwd(), 'pool-output.txt');
if (!fs.existsSync(outputFilePath)) {
  console.error('❌ Error: pool-output.txt not found!');
  console.log('\n💡 Usage:');
  console.log('  1. Copy Hardhat output to pool-output.txt');
  console.log('  2. Run: npm run parse-pools\n');
  process.exit(1);
}

// Read pool-output.txt
const output = fs.readFileSync(outputFilePath, 'utf8');
console.log('📄 Reading pool-output.txt...\n');

// Split by deployment sections (handles multiple pools)
const sections = output.split('--- Deployment and Pool Setup Complete ---');
console.log(`📦 Found ${sections.length} deployment section(s)\n`);

const newPools = [];

sections.forEach((section, index) => {
  // Extract info using regex
  const token0Match = section.match(/Ordered Token 0 \(poolKeyForInitialize\): (0x[a-fA-F0-9]{40})/);
  const token1Match = section.match(/Ordered Token 1 \(poolKeyForInitialize\): (0x[a-fA-F0-9]{40})/);
  const poolIdMatch = section.match(/Pool ID: (0x[a-fA-F0-9]{64})/);
  const feeMatch = section.match(/Pool Fee: (\d+)/);
  const tickSpacingMatch = section.match(/Pool Tick Spacing: (\d+)/);

  if (token0Match && token1Match && poolIdMatch && feeMatch && tickSpacingMatch) {
    const pool = {
      token0: token0Match[1],
      token1: token1Match[1],
      fee: parseInt(feeMatch[1]),
      tickSpacing: parseInt(tickSpacingMatch[1]),
      hooks: '0x0000000000000000000000000000000000000000',
      chainId: 11155111, // Sepolia (could be enhanced to detect from output)
      poolId: poolIdMatch[1], // For duplicate detection
    };

    // Validate addresses
    if (pool.token0.length !== 42 || pool.token1.length !== 42 || pool.poolId.length !== 66) {
      console.warn(`⚠️  Section ${index + 1}: Invalid address format, skipping...`);
      return;
    }

    newPools.push(pool);
    console.log(`✨ Parsed pool from section ${index + 1}:`);
    console.log(`   Pool ID: ${pool.poolId.slice(0, 10)}...`);
    console.log(`   Token0: ${pool.token0}`);
    console.log(`   Token1: ${pool.token1}`);
    console.log(`   Fee: ${pool.fee} (${pool.fee / 10000}%)`);
    console.log(`   Tick Spacing: ${pool.tickSpacing}\n`);
  }
});

if (newPools.length === 0) {
  console.error('❌ No valid pools found in output!');
  console.log('\n💡 Make sure the output contains:');
  console.log('  - "Ordered Token 0 (poolKeyForInitialize): 0x..."');
  console.log('  - "Ordered Token 1 (poolKeyForInitialize): 0x..."');
  console.log('  - "Pool ID: 0x..."');
  console.log('  - "Pool Fee: 3000"');
  console.log('  - "Pool Tick Spacing: 10"\n');
  process.exit(1);
}

// Read existing saved-pools.ts
const configPath = path.join(__dirname, '../src/config/saved-pools.ts');
let existingContent = '';

try {
  existingContent = fs.readFileSync(configPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading saved-pools.ts:', error.message);
  process.exit(1);
}

// Parse existing pools array
const existingPoolsMatch = existingContent.match(/SAVED_POOLS: SavedPoolDefinition\[\] = \[([\s\S]*?)\];/);
const existingPools = [];

if (existingPoolsMatch && existingPoolsMatch[1].trim()) {
  // Simple parsing - extract poolIds from existing content
  const poolIdMatches = existingPoolsMatch[1].matchAll(/\/\/ Pool: (0x[a-fA-F0-9]{64})/g);
  for (const match of poolIdMatches) {
    existingPools.push({ poolId: match[1] });
  }
}

console.log(`📋 Found ${existingPools.length} existing pool(s) in config\n`);

// Merge: Filter out duplicates by poolId
const allPools = [];
let addedCount = 0;
let skippedCount = 0;

newPools.forEach(newPool => {
  const isDuplicate = existingPools.find(p => p.poolId === newPool.poolId);
  if (!isDuplicate) {
    allPools.push(newPool);
    addedCount++;
    console.log(`✅ Adding pool: ${newPool.poolId.slice(0, 10)}...`);
  } else {
    skippedCount++;
    console.log(`⏭️  Skipped duplicate: ${newPool.poolId.slice(0, 10)}...`);
  }
});

// Generate new config content
const poolsCode = allPools.map(p => `  // Pool: ${p.poolId}
  {
    token0: '${p.token0}' as Address,
    token1: '${p.token1}' as Address,
    fee: ${p.fee},
    tickSpacing: ${p.tickSpacing},
    hooks: '${p.hooks}' as Address,
    chainId: ${p.chainId},
  }`).join(',\n');

// Build new file content
const newContent = `import { Address } from 'viem';
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
${existingPoolsMatch && existingPoolsMatch[1].trim() ? existingPoolsMatch[1].trim() + (allPools.length > 0 ? ',\n' : '') : ''}${poolsCode}
];

export const getSavedPoolsByChain = (chainId: SupportedChainId): SavedPoolDefinition[] => {
  return SAVED_POOLS.filter(pool => pool.chainId === chainId);
};
`;

// Write back to src/config/saved-pools.ts
try {
  fs.writeFileSync(configPath, newContent);
  console.log('\n💾 Updated saved-pools.ts successfully!');
  console.log(`   ✅ Added: ${addedCount} pool(s)`);
  console.log(`   ⏭️  Skipped: ${skippedCount} duplicate(s)`);
  console.log(`   📊 Total pools in config: ${existingPools.length + addedCount}\n`);
  console.log('🎉 Done! Reload your app to see the pools.\n');
} catch (error) {
  console.error('❌ Error writing saved-pools.ts:', error.message);
  process.exit(1);
}
