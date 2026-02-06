/**
 * ZK Proof Generator for GhostRoute Privacy Circuit
 *
 * Generates zero-knowledge proofs for withdraw and executeAction operations
 *
 * IMPORTANT: This module is CLIENT-SIDE ONLY (browser)
 */

import { Note } from '@/types/utxo/note';

// Dynamic imports to avoid SSR issues
let Noir: any = null;
let BarretenbergBackend: any = null;

// Lazy load Noir libraries only on client-side
async function loadNoirLibs() {
  if (typeof window === 'undefined') {
    throw new Error('Noir libraries can only be used in browser');
  }

  if (!Noir) {
    const noirModule = await import('@noir-lang/noir_js');
    Noir = noirModule.Noir;
  }

  if (!BarretenbergBackend) {
    const backendModule = await import('@noir-lang/backend_barretenberg');
    BarretenbergBackend = backendModule.BarretenbergBackend;
  }

  return { Noir, BarretenbergBackend };
}

// Cache compiled circuit
let cachedCircuit: any = null;
let cachedBackend: any = null;
let cachedNoir: any = null;

/**
 * Load and cache circuit (client-side only)
 */
async function getCircuit(): Promise<{ circuit: any; backend: any; noir: any }> {
  if (typeof window === 'undefined') {
    throw new Error('Circuit can only be initialized in browser');
  }

  if (cachedCircuit && cachedBackend && cachedNoir) {
    return { circuit: cachedCircuit, backend: cachedBackend, noir: cachedNoir };
  }

  // Load Noir libraries
  const { Noir: NoirClass, BarretenbergBackend: BackendClass } = await loadNoirLibs();

  // Load circuit JSON
  const response = await fetch('/circuits/privacy.json');
  cachedCircuit = await response.json();

  // Initialize backend
  cachedBackend = new BackendClass(cachedCircuit);

  // Initialize Noir
  cachedNoir = new NoirClass(cachedCircuit, cachedBackend);

  return { circuit: cachedCircuit, backend: cachedBackend, noir: cachedNoir };
}

/**
 * Convert value to Field string
 */
function toField(value: bigint | number | string | Uint8Array): string {
  if (value instanceof Uint8Array) {
    return BigInt('0x' + Buffer.from(value).toString('hex')).toString();
  }
  return BigInt(value).toString();
}

/**
 * Convert Ethereum address to Field
 */
function addressToField(address: string): string {
  const cleaned = address.startsWith('0x') ? address.slice(2) : address;
  return BigInt('0x' + cleaned).toString();
}

/**
 * Generate proof for withdraw operation
 */
export async function generateWithdrawProof(params: {
  // Input note being spent
  inputNote: Note;

  // Merkle proof
  merkleRoot: string;
  merkleProof: string[]; // 20 siblings
  leafIndex: number;

  // Withdraw parameters
  withdrawAmount: bigint;
  recipient: string;

  // Change note
  changeNote: {
    amount: bigint;
    nullifier_secret: Uint8Array;
    blinding: Uint8Array;
  };
}): Promise<{
  proof: Uint8Array;
  publicInputs: string[];
}> {
  const { noir } = await getCircuit();

  // Prepare witness (circuit inputs)
  const witness = {
    // PUBLIC INPUTS
    root: toField(params.merkleRoot),
    nullifier_hash: toField(params.inputNote.nullifier || '0x00'),
    change_commitment: toField('0x00'), // Computed by circuit
    is_withdrawal: true,
    action_hash: toField('0x00'), // Computed by circuit from recipient + amount
    amount: toField(params.withdrawAmount),
    recipient: addressToField(params.recipient),

    // PRIVATE INPUTS
    note: {
      asset_id: toField(params.inputNote.token),
      amount: toField(params.inputNote.value),
      nullifier_secret: toField(params.inputNote.nullifier || '0x00'),
      blinding: toField(params.inputNote.salt || '0x00'),
    },
    index: toField(params.leafIndex),
    path: params.merkleProof.map(toField),
    change_note: {
      asset_id: toField(params.inputNote.token),
      amount: toField(params.changeNote.amount),
      nullifier_secret: toField(params.changeNote.nullifier_secret),
      blinding: toField(params.changeNote.blinding),
    },
  };

  // Generate proof
  const { witness: computedWitness, returnValue } = await noir.execute(witness);
  const proof = await noir.generateProof(computedWitness);

  return {
    proof: proof.proof,
    publicInputs: proof.publicInputs as string[],
  };
}

/**
 * Generate proof for executeAction (investment)
 */
export async function generateInvestmentProof(params: {
  // Input note being spent
  inputNote: Note;

  // Merkle proof
  merkleRoot: string;
  merkleProof: string[];
  leafIndex: number;

  // Investment parameters
  investAmount: bigint;
  actionHash: string; // Pre-computed from Uniswap params

  // Change note
  changeNote: {
    amount: bigint;
    nullifier_secret: Uint8Array;
    blinding: Uint8Array;
  };
}): Promise<{
  proof: Uint8Array;
  publicInputs: string[];
}> {
  const { noir } = await getCircuit();

  const witness = {
    // PUBLIC INPUTS
    root: toField(params.merkleRoot),
    nullifier_hash: toField(params.inputNote.nullifier || '0x00'),
    change_commitment: toField('0x00'),
    is_withdrawal: false, // Investment, not withdrawal
    action_hash: toField(params.actionHash),
    amount: toField(params.investAmount),
    recipient: toField(0), // Not used for investment

    // PRIVATE INPUTS
    note: {
      asset_id: toField(params.inputNote.token),
      amount: toField(params.inputNote.value),
      nullifier_secret: toField(params.inputNote.nullifier || '0x00'),
      blinding: toField(params.inputNote.salt || '0x00'),
    },
    index: toField(params.leafIndex),
    path: params.merkleProof.map(toField),
    change_note: {
      asset_id: toField(params.inputNote.token),
      amount: toField(params.changeNote.amount),
      nullifier_secret: toField(params.changeNote.nullifier_secret),
      blinding: toField(params.changeNote.blinding),
    },
  };

  const { witness: computedWitness } = await noir.execute(witness);
  const proof = await noir.generateProof(computedWitness);

  return {
    proof: proof.proof,
    publicInputs: proof.publicInputs as string[],
  };
}

/**
 * Verify proof (for testing)
 */
export async function verifyProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
  const { noir } = await getCircuit();
  return await noir.verifyProof({ proof, publicInputs });
}
