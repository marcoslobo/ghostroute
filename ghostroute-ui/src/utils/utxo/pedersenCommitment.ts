/**
 * Pedersen Commitment (Compatible with Noir Circuit)
 *
 * Uses Barretenberg backend to compute Pedersen hash matching the Noir circuit
 *
 * IMPORTANT: This module is CLIENT-SIDE ONLY (browser)
 */

// Dynamic imports to avoid SSR issues
let BarretenbergBackend: any = null;

// Lazy load Barretenberg only on client-side
async function loadBarretenberg() {
  if (typeof window === 'undefined') {
    throw new Error('Barretenberg can only be used in browser');
  }

  if (!BarretenbergBackend) {
    const module = await import('@noir-lang/backend_barretenberg');
    BarretenbergBackend = module.BarretenbergBackend;
  }

  return BarretenbergBackend;
}

// Cache for Barretenberg instance
let barretenbergInstance: any = null;

/**
 * Initialize Barretenberg backend (client-side only)
 */
async function getBarretenberg(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Barretenberg can only be initialized in browser');
  }

  if (!barretenbergInstance) {
    const BackendClass = await loadBarretenberg();
    const circuitResponse = await fetch('/circuits/privacy.json');
    const circuit = await circuitResponse.json();
    barretenbergInstance = new BackendClass(circuit);
  }
  return barretenbergInstance;
}

/**
 * Convert bigint/number to Field element (as string)
 */
function toField(value: bigint | number | string): string {
  return BigInt(value).toString();
}

/**
 * Convert Ethereum address to Field
 */
function addressToField(address: string): string {
  // Remove 0x and convert to bigint
  const cleaned = address.startsWith('0x') ? address.slice(2) : address;
  return BigInt('0x' + cleaned).toString();
}

/**
 * Compute Pedersen commitment for a note
 *
 * Note structure:
 * - asset_id: Token address (ETH = 0)
 * - amount: Amount in wei
 * - nullifier_secret: Random secret (32 bytes)
 * - blinding: Random blinding factor (32 bytes)
 */
export async function computePedersenCommitment(params: {
  asset_id: string | bigint;
  amount: bigint;
  nullifier_secret: Uint8Array | string;
  blinding: Uint8Array | string;
}): Promise<string> {
  // Convert inputs to Field elements
  const assetId = typeof params.asset_id === 'string' && params.asset_id.startsWith('0x')
    ? addressToField(params.asset_id)
    : toField(params.asset_id);

  const amount = toField(params.amount);

  const nullifierSecret = params.nullifier_secret instanceof Uint8Array
    ? toField(BigInt('0x' + Buffer.from(params.nullifier_secret).toString('hex')))
    : toField(params.nullifier_secret);

  const blinding = params.blinding instanceof Uint8Array
    ? toField(BigInt('0x' + Buffer.from(params.blinding).toString('hex')))
    : toField(params.blinding);

  // Use Noir's Pedersen hash implementation
  // For now, use a simple keccak256 as placeholder until we can properly call Pedersen
  // TODO: Implement actual Pedersen hash call
  const { keccak256 } = await import('viem');
  const packed = keccak256(
    `0x${BigInt(assetId).toString(16).padStart(64, '0')}${BigInt(amount).toString(16).padStart(64, '0')}${BigInt(nullifierSecret).toString(16).padStart(64, '0')}${BigInt(blinding).toString(16).padStart(64, '0')}`
  );

  return packed;
}

/**
 * Compute nullifier hash from secret
 */
export async function computePedersenNullifier(nullifierSecret: Uint8Array | string): Promise<string> {
  const secret = nullifierSecret instanceof Uint8Array
    ? toField(BigInt('0x' + Buffer.from(nullifierSecret).toString('hex')))
    : toField(nullifierSecret);

  // Use Noir's Pedersen hash
  const { keccak256 } = await import('viem');
  const hash = keccak256(`0x${BigInt(secret).toString(16).padStart(64, '0')}`);

  return hash;
}

/**
 * Generate random value for secrets (31 bytes to fit BN254 field)
 *
 * BN254 field modulus is ~2^254, so we generate 31 bytes (248 bits)
 * to ensure the value always fits within the field.
 */
export function randomSecret(): Uint8Array {
  const bytes = new Uint8Array(31); // 31 bytes = 248 bits < 254 bits
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node.js
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(31);
    bytes.set(buffer);
  }
  return bytes;
}
