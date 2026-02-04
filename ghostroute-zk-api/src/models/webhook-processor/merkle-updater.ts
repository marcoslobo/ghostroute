/**
 * Merkle Tree Updater
 * 
 * Handles Merkle tree updates for deposits and ActionExecuted events.
 * Manages leaf insertion and note invalidation for UTXO operations.
 */

import {
  DecodedParamsMap,
  MerkleTreeLeaf,
} from "./types.ts";
import * as database from "../../lib/database.ts";

/**
 * Handles a deposit event by inserting a new leaf into the Merkle tree.
 * 
 * @param decoded - The decoded parameters from the webhook
 * @param vaultAddress - The vault contract address
 * @param chainId - The blockchain network ID
 * @returns Object containing the leafIndex and commitment
 * 
 * @throws Error if required deposit fields are missing
 */
export async function handleDeposit(
  decoded: DecodedParamsMap,
  vaultAddress: string,
  chainId: number,
): Promise<{ leafIndex: number; commitment: string }> {
  const commitment = decoded.commitment as string;
  const leafIndex = decoded.leafIndex as number;

  if (commitment === undefined || commitment === null) {
    throw new Error("Deposit event missing required field: commitment");
  }

  if (leafIndex === undefined || leafIndex === null) {
    throw new Error("Deposit event missing required field: leafIndex");
  }

  if (typeof leafIndex !== "number" || !Number.isInteger(leafIndex) || leafIndex < 0) {
    throw new Error(`Invalid leafIndex: ${leafIndex}. Must be a non-negative integer.`);
  }

  if (typeof commitment !== "string" || !commitment.startsWith("0x")) {
    throw new Error(`Invalid commitment format: ${commitment}. Must be a hex string with 0x prefix.`);
  }

  // Insert the Merkle leaf into the database
  await database.insertMerkleLeaf(
    vaultAddress,
    chainId,
    leafIndex,
    commitment,
  );

  console.log(`Deposit processed: vault=${vaultAddress}, chain=${chainId}, leafIndex=${leafIndex}, commitment=${commitment}`);

  return {
    leafIndex,
    commitment,
  };
}

/**
 * Handles an ActionExecuted event by:
 * 1. Invalidating the old note via nullifierHash
 * 2. Inserting a new UTXO with changeCommitment and changeIndex
 * 
 * @param decoded - The decoded parameters from the webhook
 * @param vaultAddress - The vault contract address
 * @param chainId - The blockchain network ID
 * @returns Object containing nullifierHash, changeCommitment, and changeIndex
 * 
 * @throws Error if required ActionExecuted fields are missing
 */
export async function handleActionExecuted(
  decoded: DecodedParamsMap,
  vaultAddress: string,
  chainId: number,
): Promise<{
  nullifierHash: string;
  changeCommitment: string;
  changeIndex: number;
}> {
  const nullifierHash = decoded.nullifierHash as string;
  const changeCommitment = decoded.changeCommitment as string;
  const changeIndex = decoded.changeIndex as number;

  if (nullifierHash === undefined || nullifierHash === null) {
    throw new Error("ActionExecuted event missing required field: nullifierHash");
  }

  if (changeCommitment === undefined || changeCommitment === null) {
    throw new Error("ActionExecuted event missing required field: changeCommitment");
  }

  if (changeIndex === undefined || changeIndex === null) {
    throw new Error("ActionExecuted event missing required field: changeIndex");
  }

  // Validate nullifierHash format
  if (typeof nullifierHash !== "string" || !nullifierHash.startsWith("0x")) {
    throw new Error(`Invalid nullifierHash format: ${nullifierHash}. Must be a hex string with 0x prefix.`);
  }

  // Validate changeCommitment format
  if (typeof changeCommitment !== "string" || !changeCommitment.startsWith("0x")) {
    throw new Error(`Invalid changeCommitment format: ${changeCommitment}. Must be a hex string with 0x prefix.`);
  }

  // Validate changeIndex
  if (typeof changeIndex !== "number" || !Number.isInteger(changeIndex) || changeIndex < 0) {
    throw new Error(`Invalid changeIndex: ${changeIndex}. Must be a non-negative integer.`);
  }

  // Step 1: Mark the old note as spent using the nullifier
  const noteInvalidated = await database.markNoteAsSpent(
    nullifierHash,
    vaultAddress,
    chainId,
  );

  if (!noteInvalidated) {
    console.warn(`Note not found for nullifier: ${nullifierHash}. May have already been spent or not exist.`);
  }

  // Step 2: Insert the new UTXO (change) leaf
  await database.insertChangeLeaf(
    vaultAddress,
    chainId,
    changeIndex,
    changeCommitment,
  );

  console.log(`ActionExecuted processed: vault=${vaultAddress}, chain=${chainId}, nullifier=${nullifierHash}, changeIndex=${changeIndex}`);

  return {
    nullifierHash,
    changeCommitment,
    changeIndex,
  };
}

/**
 * Marks a note as spent using its nullifier hash.
 * 
 * @param nullifierHash - The nullifier hash of the spent note
 * @param vaultAddress - The vault contract address
 * @param chainId - The blockchain network ID
 * @returns true if the note was found and marked as spent
 */
export async function markNoteAsSpent(
  nullifierHash: string,
  vaultAddress: string,
  chainId: number,
): Promise<boolean> {
  return await database.markNoteAsSpent(
    nullifierHash,
    vaultAddress,
    chainId,
  );
}

/**
 * Gets the current active leaves for a vault.
 * 
 * @param vaultAddress - The vault contract address
 * @param chainId - The blockchain network ID
 * @returns Array of active Merkle tree leaves
 */
export async function getActiveLeaves(
  vaultAddress: string,
  chainId: number,
): Promise<MerkleTreeLeaf[]> {
  const client = await import("../../lib/database.ts");
  const pool = client.getPool();
  
  if (!pool) {
    throw new Error("Database not initialized");
  }

  const result = await pool.queryObject<MerkleTreeLeaf>(
    `SELECT * FROM merkle_tree_leaves 
     WHERE vault_address = $1 AND chain_id = $2 AND is_active = TRUE
     ORDER BY leaf_index ASC`,
    [vaultAddress, chainId],
  );

  return result.rows;
}

/**
 * Gets the total count of leaves for a vault.
 * 
 * @param vaultAddress - The vault contract address
 * @param chainId - The blockchain network ID
 * @returns Total count of leaves (both active and spent)
 */
export async function getLeafCount(
  vaultAddress: string,
  chainId: number,
): Promise<number> {
  const client = await import("../../lib/database.ts");
  const pool = client.getPool();
  
  if (!pool) {
    throw new Error("Database not initialized");
  }

  const result = await pool.queryObject<{ count: string }>(
    `SELECT COUNT(*) as count FROM merkle_tree_leaves 
     WHERE vault_address = $1 AND chain_id = $2`,
    [vaultAddress, chainId],
  );

  return parseInt(result.rows[0]?.count ?? "0", 10);
}
