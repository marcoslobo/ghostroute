#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { gzipSync, gunzipSync } from 'zlib';

async function generateVerifier() {
  const { Barretenberg, Crs, RawBuffer } = await import('@aztec/bb.js');
  
  const circuitPath = './target/ghostroute_privacy_circuit.json';
  const crsPath = './target/crs';
  
  if (!existsSync(circuitPath)) {
    console.error(`Circuit file not found: ${circuitPath}`);
    process.exit(1);
  }
  
  console.log('Loading circuit...');
  const circuit = JSON.parse(readFileSync(circuitPath, 'utf8'));
  
  console.log('Decompressing bytecode...');
  const compressed = Buffer.from(circuit.bytecode, 'base64');
  const bytecode = gunzipSync(compressed);
  
  console.log(`Bytecode size: ${bytecode.length} bytes`);
  
  console.log('Initializing Barretenberg...');
  const bb = await Barretenberg.new({ threads: 1 });
  
  console.log('Computing circuit sizes...');
  try {
    const [total] = await bb.acirGetCircuitSizes(new RawBuffer(bytecode), false, false);
    console.log(`Circuit total gates: ${total}`);
    
    const dyadicSize = Math.pow(2, Math.ceil(Math.log2(total)));
    console.log(`Dyadic circuit size: ${dyadicSize}`);
    
    if (!existsSync(crsPath)) {
      mkdirSync(crsPath, { recursive: true });
    }
    
    console.log('Initializing CRS...');
    const crs = await Crs.new(dyadicSize + 1, crsPath);
    
    console.log('Generating Solidity verifier...');
    const vk = await bb.acirWriteVkUltraHonk(new RawBuffer(bytecode));
    const verifier = await bb.acirHonkSolidityVerifier(vk, new RawBuffer(bytecode));
    
    writeFileSync('./target/Verifier.sol', verifier);
    console.log('✓ Verifier written to target/Verifier.sol');
    console.log(`  File size: ${verifier.length} bytes`);
  } catch (err) {
    console.error('Error during processing:', err.message);
  }
  
  await bb.destroy();
}

generateVerifier().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
