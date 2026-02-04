/**
 * Webhook Payload Processor - Type Definitions
 * 
 * Defines TypeScript interfaces for webhook payloads, processing results,
 * and domain entities for the GhostRoute privacy protocol.
 */

/**
 * Represents the incoming JSON payload from the EVM listener.
 */
export interface WebhookPayload {
  TransactionHash: string;
  LogIndex: number;
  ContractAddress: string;
  BlockchainNetworkId: number;
  DecodedParametersNames: string[];
  DecodedParametersValues: unknown[];
  BlockNumber?: number;
  BlockHash?: string;
  EventSignature?: string;
}

/**
 * Dynamic key-value mapping created from DecodedParametersNames and DecodedParametersValues.
 */
export type DecodedParamsMap = Record<string, unknown>;

/**
 * Supported event types in the webhook payload.
 */
export type EventType = 'Deposit' | 'ActionExecuted' | 'Unknown';

/**
 * Merkle tree update details for the processing result.
 */
export interface MerkleUpdate {
  leafIndex: number;
  commitment: string;
  treeType: 'deposit' | 'change';
}

/**
 * Nullifier details for the processing result.
 */
export interface NullifierInfo {
  nullifierHash: string;
  noteInvalidated: boolean;
}

/**
 * Result of processing a webhook payload.
 */
export interface ProcessingResult {
  success: boolean;
  idempotent: boolean;
  eventType: EventType;
  transactionHash: string;
  logIndex: number;
  vaultAddress: string;
  chainId: number;
  merkleUpdate: MerkleUpdate | null;
  nullifier: NullifierInfo | null;
  processedAt: string;
}

/**
 * Result returned when an event was already processed (idempotent case).
 */
export interface DuplicateEventResult {
  success: boolean;
  idempotent: boolean;
  message: string;
  originalProcessedAt: string;
}

/**
 * Database record for processed events.
 */
export interface ProcessedEventRecord {
  transaction_hash: string;
  log_index: number;
  vault_address: string;
  chain_id: number;
  event_type: string;
  commitment: string | null;
  leaf_index: number | null;
  nullifier_hash: string | null;
  change_commitment: string | null;
  change_index: number | null;
  processed_at: Date;
  raw_payload: Record<string, unknown>;
}

/**
 * Merkle tree leaf entity representing a UTXO in the privacy vault.
 */
export interface MerkleTreeLeaf {
  id: string;
  vault_address: string;
  chain_id: number;
  leaf_index: number;
  commitment: string;
  created_at: Date;
  is_active: boolean;
  spent_at: Date | null;
  spent_nullifier: string | null;
}

/**
 * Result of batch processing multiple webhook payloads.
 */
export interface BatchProcessingResult {
  total: number;
  successful: number;
  failed: number;
  results: BatchItemResult[];
}

/**
 * Individual result for a batch item.
 */
export interface BatchItemResult {
  success: boolean;
  index: number;
  error: string | null;
  result: ProcessingResult | null;
}

/**
 * Configuration for the webhook processor.
 */
export interface ProcessorConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  merkleTreeDepth: number;
  defaultChainId: number;
  supportedChainIds: number[];
}

/**
 * Health status response.
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: string;
    merkleTree: string;
  };
}
