/**
 * Event Processor Service
 * 
 * Orchestrates the complete webhook event processing flow:
 * 1. Parse and validate payload
 * 2. Check idempotency
 * 3. Route to appropriate handler (Deposit / ActionExecuted)
 * 4. Update Merkle tree
 * 5. Record processed event
 */

import {
  WebhookPayload,
  ProcessingResult,
  BatchProcessingResult,
  BatchItemResult,
} from "../models/webhook-processor/types.ts";
import { mapParams } from "../models/webhook-processor/mapper.ts";
import { validateWebhookPayload } from "../models/webhook-processor/validator.ts";
import { determineEventType, describeEvent } from "../models/webhook-processor/event-router.ts";
import {
  checkIdempotency,
  recordProcessedEvent,
} from "../models/webhook-processor/idempotency.ts";
import { handleDeposit, handleActionExecuted } from "../models/webhook-processor/merkle-updater.ts";
import { initDatabase, checkDatabaseHealth } from "../lib/database.ts";

let initialized = false;

/**
 * Initialize the event processor.
 * Must be called before processing any events.
 */
export async function initProcessor(): Promise<void> {
  if (initialized) {
    return;
  }

  await initDatabase();
  initialized = true;
  console.log("Event processor initialized");
}

/**
 * Check if the processor is initialized.
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Process a single webhook payload.
 * 
 * @param payload - The webhook payload to process
 * @returns ProcessingResult with success status and event details
 */
export async function processWebhookPayload(
  payload: WebhookPayload,
): Promise<ProcessingResult> {
  // Initialize if not already done
  if (!initialized) {
    await initProcessor();
  }

  const startTime = Date.now();

  // Step 1: Validate payload structure
  const validation = validateWebhookPayload(payload);
  
  if (!validation.isValid) {
    return {
      success: false,
      idempotent: false,
      eventType: "Unknown",
      transactionHash: payload.TransactionHash,
      logIndex: payload.LogIndex,
      vaultAddress: payload.ContractAddress,
      chainId: payload.BlockchainNetworkId,
      merkleUpdate: null,
      nullifier: null,
      processedAt: new Date().toISOString(),
    };
  }

  // Step 2: Check idempotency
  const { isDuplicate, existingResult } = await checkIdempotency(
    payload.TransactionHash,
    payload.LogIndex,
  );

  if (isDuplicate && existingResult) {
    console.log(
      `Duplicate event detected: ${payload.TransactionHash}:${payload.LogIndex}`,
    );
    return {
      ...existingResult,
      idempotent: true,
    };
  }

  // Step 3: Map decoded parameters
  const decoded = mapParams(
    payload.DecodedParametersNames,
    payload.DecodedParametersValues,
  );

  // Step 4: Determine event type
  const eventType = determineEventType(decoded);
  console.log(`Processing ${eventType} event: ${describeEvent(eventType, decoded)}`);

  // Step 5: Handle event based on type
  let merkleUpdate: ProcessingResult["merkleUpdate"] = null;
  let nullifier: ProcessingResult["nullifier"] = null;

  try {
    switch (eventType) {
      case "Deposit": {
        const result = await handleDeposit(
          decoded,
          payload.ContractAddress,
          payload.BlockchainNetworkId,
        );
        merkleUpdate = {
          leafIndex: result.leafIndex,
          commitment: result.commitment,
          treeType: "deposit",
        };
        break;
      }

      case "ActionExecuted": {
        const result = await handleActionExecuted(
          decoded,
          payload.ContractAddress,
          payload.BlockchainNetworkId,
        );
        merkleUpdate = {
          leafIndex: result.changeIndex,
          commitment: result.changeCommitment,
          treeType: "change",
        };
        nullifier = {
          nullifierHash: result.nullifierHash,
          noteInvalidated: true,
        };
        break;
      }

      case "Unknown":
      default:
        console.warn(
          `Unknown event type for ${payload.TransactionHash}:${payload.LogIndex}`,
        );
        break;
    }
  } catch (error) {
    console.error(
      `Error processing event ${payload.TransactionHash}:${payload.LogIndex}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }

  // Step 6: Record the processed event
  await recordProcessedEvent(payload, eventType, decoded);

  const processingTime = Date.now() - startTime;
  console.log(`Event processed in ${processingTime}ms`);

  return {
    success: true,
    idempotent: false,
    eventType,
    transactionHash: payload.TransactionHash,
    logIndex: payload.LogIndex,
    vaultAddress: payload.ContractAddress,
    chainId: payload.BlockchainNetworkId,
    merkleUpdate,
    nullifier,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Process multiple webhook payloads in batch.
 * 
 * @param payloads - Array of webhook payloads to process
 * @returns BatchProcessingResult with individual and aggregate results
 */
export async function processBatch(
  payloads: WebhookPayload[],
): Promise<BatchProcessingResult> {
  const results: BatchItemResult[] = [];
  let successful = 0;
  let failed = 0;

  // Initialize if not already done
  if (!initialized) {
    await initProcessor();
  }

  // Process each payload independently
  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i];

    try {
      const result = await processWebhookPayload(payload);
      
      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      results.push({
        success: result.success,
        index: i,
        error: result.success ? null : "Processing failed",
        result,
      });
    } catch (error) {
      failed++;
      results.push({
        success: false,
        index: i,
        error: error instanceof Error ? error.message : "Unknown error",
        result: null,
      });
    }
  }

  return {
    total: payloads.length,
    successful,
    failed,
    results,
  };
}

/**
 * Check the health of the event processor.
 */
export async function checkProcessorHealth(): Promise<{
  database: boolean;
  merkleTree: boolean;
}> {
  const dbHealthy = await checkDatabaseHealth();

  return {
    database: dbHealthy,
    merkleTree: dbHealthy, // If database is healthy, assume merkle tree is accessible
  };
}
