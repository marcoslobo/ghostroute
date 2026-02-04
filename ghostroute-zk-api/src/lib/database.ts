/**
 * Database Module
 * 
 * Provides PostgreSQL connection pool management and database operations
 * for the webhook payload processor.
 */

import { Client } from "pg";
import {
  ProcessedEventRecord,
} from "../models/webhook-processor/types.ts";

let pool: Client | null = null;

/**
 * Initialize the database connection pool.
 */
export async function initDatabase(): Promise<Client> {
  if (pool) {
    return pool;
  }

  const connectionString = Deno.env.get("DATABASE_URL") ||
    "postgresql://localhost:5432/ghostroute";

  pool = new Client({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  await pool.connect();
  console.log("Database connection pool initialized");
  return pool;
}

/**
 * Get the database pool instance.
 */
export function getPool(): Client | null {
  return pool;
}

/**
 * Close the database connection pool.
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database connection pool closed");
  }
}

/**
 * Check if an event has already been processed (idempotency check).
 */
export async function checkIdempotency(
  transactionHash: string,
  logIndex: number,
): Promise<{ isDuplicate: boolean; existingEvent?: ProcessedEventRecord }> {
  const client = getPool();
  if (!client) {
    throw new Error("Database not initialized");
  }

  const result = await client.queryObject<ProcessedEventRecord>(
    `SELECT * FROM processed_events 
     WHERE transaction_hash = $1 AND log_index = $2`,
    [transactionHash, logIndex],
  );

  if (result.rows.length > 0) {
    return {
      isDuplicate: true,
      existingEvent: result.rows[0],
    };
  }

  return { isDuplicate: false };
}

/**
 * Insert a new processed event record.
 */
export async function insertProcessedEvent(
  payload: Record<string, unknown>,
  eventType: string,
  decoded: Record<string, unknown>,
): Promise<void> {
  const client = getPool();
  if (!client) {
    throw new Error("Database not initialized");
  }

  const transactionHash = payload.TransactionHash as string;
  const logIndex = payload.LogIndex as number;
  const contractAddress = payload.ContractAddress as string;
  const blockchainNetworkId = payload.BlockchainNetworkId as number;

  await client.queryObject(
    `INSERT INTO processed_events (
      transaction_hash, log_index, vault_address, chain_id,
      event_type, commitment, leaf_index, nullifier_hash,
      change_commitment, change_index, raw_payload
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      transactionHash,
      logIndex,
      contractAddress,
      blockchainNetworkId,
      eventType,
      decoded.commitment ?? null,
      decoded.leafIndex ?? null,
      decoded.nullifierHash ?? null,
      decoded.changeCommitment ?? null,
      decoded.changeIndex ?? null,
      JSON.stringify(payload),
    ],
  );
}

/**
 * Get a processed event by transaction hash and log index.
 */
export async function getProcessedEvent(
  transactionHash: string,
  logIndex: number,
): Promise<ProcessedEventRecord | null> {
  const client = getPool();
  if (!client) {
    throw new Error("Database not initialized");
  }

  const result = await client.queryObject<ProcessedEventRecord>(
    `SELECT * FROM processed_events 
     WHERE transaction_hash = $1 AND log_index = $2`,
    [transactionHash, logIndex],
  );

  return result.rows[0] ?? null;
}

/**
 * Insert a new Merkle tree leaf for a deposit.
 */
export async function insertMerkleLeaf(
  vaultAddress: string,
  chainId: number,
  leafIndex: number,
  commitment: string,
): Promise<void> {
  const client = getPool();
  if (!client) {
    throw new Error("Database not initialized");
  }

  await client.queryObject(
    `INSERT INTO merkle_tree_leaves (
      vault_address, chain_id, leaf_index, commitment, is_active
    ) VALUES ($1, $2, $3, $4, TRUE)
    ON CONFLICT (vault_address, chain_id, leaf_index) DO NOTHING`,
    [vaultAddress, chainId, leafIndex, commitment],
  );
}

/**
 * Mark a note as spent using the nullifier hash.
 */
export async function markNoteAsSpent(
  nullifierHash: string,
  vaultAddress: string,
  chainId: number,
): Promise<boolean> {
  const client = getPool();
  if (!client) {
    throw new Error("Database not initialized");
  }

  const result = await client.queryObject(
    `UPDATE merkle_tree_leaves 
     SET is_active = FALSE, spent_at = NOW(), spent_nullifier = $1
     WHERE vault_address = $2 AND chain_id = $3
     AND commitment IN (
       SELECT commitment FROM processed_events 
       WHERE nullifier_hash = $1
     )
     RETURNING id`,
    [nullifierHash, vaultAddress, chainId],
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Insert a new UTXO leaf for change (ActionExecuted).
 */
export async function insertChangeLeaf(
  vaultAddress: string,
  chainId: number,
  changeIndex: number,
  changeCommitment: string,
): Promise<void> {
  const client = getPool();
  if (!client) {
    throw new Error("Database not initialized");
  }

  await client.queryObject(
    `INSERT INTO merkle_tree_leaves (
      vault_address, chain_id, leaf_index, commitment, is_active
    ) VALUES ($1, $2, $3, $4, TRUE)
    ON CONFLICT (vault_address, chain_id, leaf_index) DO NOTHING`,
    [vaultAddress, chainId, changeIndex, changeCommitment],
  );
}

/**
 * Check database health.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = getPool();
    if (!client) {
      return false;
    }
    await client.queryObject("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
