/**
 * Idempotency Service
 * 
 * Ensures webhook events are processed exactly once using
 * TransactionHash + LogIndex as the composite primary key.
 */

import {
  WebhookPayload,
  ProcessedEventRecord,
  ProcessingResult,
  DecodedParamsMap,
  EventType,
} from "./types.ts";
import * as database from "../../lib/database.ts";

/**
 * Checks if an event has already been processed.
 * 
 * @param txHash - The Ethereum transaction hash
 * @param logIndex - The log index within the transaction
 * @returns Object indicating if duplicate and the existing event if found
 */
export async function checkIdempotency(
  txHash: string,
  logIndex: number,
): Promise<{
  isDuplicate: boolean;
  existingEvent?: ProcessedEventRecord;
  existingResult?: ProcessingResult;
}> {
  const checkResult = await database.checkIdempotency(txHash, logIndex);
  
  if (checkResult.isDuplicate && checkResult.existingEvent) {
    return {
      isDuplicate: true,
      existingEvent: checkResult.existingEvent,
      existingResult: mapToProcessingResult(checkResult.existingEvent),
    };
  }

  return {
    isDuplicate: false,
  };
}

/**
 * Records a newly processed event for idempotency tracking.
 * 
 * @param payload - The webhook payload that was processed
 * @param eventType - The type of event (Deposit, ActionExecuted, etc.)
 * @param decoded - The decoded parameters from the payload
 */
export async function recordProcessedEvent(
  payload: WebhookPayload,
  eventType: EventType,
  decoded: DecodedParamsMap,
): Promise<void> {
  await database.insertProcessedEvent(
    payload as unknown as Record<string, unknown>,
    eventType,
    decoded,
  );
}

/**
 * Attempts to process an event with idempotency protection.
 * Returns the existing result if the event was already processed.
 * 
 * @param payload - The webhook payload
 * @param processFn - Function to process the event if not already processed
 * @returns ProcessingResult including idempotent flag
 */
export async function processWithIdempotency<T extends ProcessingResult>(
  payload: WebhookPayload,
  processFn: () => Promise<T>,
): Promise<T> {
  const { isDuplicate, existingResult } = await checkIdempotency(
    payload.TransactionHash,
    payload.LogIndex,
  );

  if (isDuplicate && existingResult) {
    return {
      ...existingResult,
      idempotent: true,
    } as T;
  }

  const result = await processFn();

  // Record the event after successful processing
  await recordProcessedEvent(
    payload,
    result.eventType,
    {},
  );

  return {
    ...result,
    idempotent: false,
  } as T;
}

/**
 * Maps a database record to a ProcessingResult.
 */
function mapToProcessingResult(record: ProcessedEventRecord): ProcessingResult {
  return {
    success: true,
    idempotent: true,
    eventType: record.event_type as EventType,
    transactionHash: record.transaction_hash,
    logIndex: record.log_index,
    vaultAddress: record.vault_address,
    chainId: record.chain_id,
    merkleUpdate: record.commitment && record.leaf_index
      ? {
          leafIndex: record.leaf_index,
          commitment: record.commitment,
          treeType: record.change_commitment ? "change" : "deposit",
        }
      : null,
    nullifier: record.nullifier_hash
      ? {
          nullifierHash: record.nullifier_hash,
          noteInvalidated: true,
        }
      : null,
    processedAt: record.processed_at.toISOString(),
  };
}

/**
 * Generates a unique key for caching purposes.
 */
export function getIdempotencyKey(payload: WebhookPayload): string {
  return `${payload.TransactionHash}:${payload.LogIndex}`;
}
