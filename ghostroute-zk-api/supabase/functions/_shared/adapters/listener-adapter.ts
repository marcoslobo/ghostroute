/**
 * Listener Payload Adapter
 *
 * Transforms blockchain event payloads from external listener format
 * into the API's expected format (NewCommitmentPayload).
 */

import { ListenerEventPayload, getChainIdFromContract } from './listener-types.ts';
import { NewCommitmentPayload, ActionExecutedPayload, WebhookPayload } from '../handlers/webhook.ts';

/**
 * Transform listener's Deposit event to NewCommitmentPayload
 *
 * @param listenerPayload - Raw payload from blockchain listener
 * @returns Transformed payload in API format
 * @throws Error if validation fails or contract address is unknown
 */
export function adaptDepositEvent(
  listenerPayload: ListenerEventPayload
): NewCommitmentPayload {
  // Validate event signature
  const expectedSignature = 'Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)';
  if (listenerPayload.EventSignature !== expectedSignature) {
    throw new Error(
      `Unsupported event signature: ${listenerPayload.EventSignature}. Expected: ${expectedSignature}`
    );
  }

  // Map contract address to chain ID (more reliable than BlockchainNetworkId)
  const contractAddress = listenerPayload.ContractAddress.toLowerCase();
  const chainId = getChainIdFromContract(contractAddress);

  if (!chainId) {
    throw new Error(
      `Unknown contract address: ${contractAddress}. ` +
        `Please add to CONTRACT_TO_CHAIN_MAP in listener-types.ts`
    );
  }

  // Extract decoded parameters
  const paramNames = listenerPayload.DecodedParametersNames;
  const paramValues = listenerPayload.DecodedParametersValues;

  // Validate arrays have same length
  if (paramNames.length !== paramValues.length) {
    throw new Error(
      `Parameter mismatch: ${paramNames.length} names vs ${paramValues.length} values`
    );
  }

  // Create parameter map for easier access
  const params: Record<string, string | number> = {};
  paramNames.forEach((name, index) => {
    params[name] = paramValues[index];
  });

  // Validate required parameters exist
  const requiredParams = ['commitment', 'amount', 'leafIndex'];
  for (const param of requiredParams) {
    if (!(param in params)) {
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // Parse block timestamp (ISO 8601 to Unix timestamp in seconds)
  const blockTimestamp = Math.floor(
    new Date(listenerPayload.BlockTimestamp).getTime() / 1000
  );

  // Validate timestamp is reasonable (not in distant past/future)
  const now = Date.now() / 1000;
  if (blockTimestamp < now - 365 * 24 * 60 * 60 || blockTimestamp > now + 60 * 60) {
    console.warn(
      `[adapter] Suspicious block timestamp: ${blockTimestamp} (${listenerPayload.BlockTimestamp})`
    );
  }

  // Build NewCommitmentPayload
  const adapted: NewCommitmentPayload = {
    eventId: listenerPayload.Id,
    chainId: chainId,
    vaultAddress: contractAddress,
    commitment: {
      hash: params.commitment as string,
      index: parseInt(params.leafIndex as string, 10),
      value: params.amount as string,
    },
    block: {
      number: listenerPayload.BlockNumber,
      hash: listenerPayload.BlockHash.toLowerCase(),
      timestamp: blockTimestamp,
    },
    transactionHash: listenerPayload.TransactionHash.toLowerCase(),
  };

  // Log successful transformation
  console.log(
    `[adapter] ✅ Adapted Deposit event: ${adapted.transactionHash.slice(0, 10)}... leafIndex=${adapted.commitment.index}`
  );

  return adapted;
}

/**
 * Transform listener's ActionExecuted event to ActionExecutedPayload
 *
 * @param listenerPayload - Raw payload from blockchain listener
 * @returns Transformed payload in API format
 * @throws Error if validation fails or contract address is unknown
 */
export function adaptActionExecutedEvent(
  listenerPayload: ListenerEventPayload
): ActionExecutedPayload {
  // Validate event signature
  const expectedSignature = 'ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)';
  if (listenerPayload.EventSignature !== expectedSignature) {
    throw new Error(
      `Unsupported event signature: ${listenerPayload.EventSignature}. Expected: ${expectedSignature}`
    );
  }

  // Map contract address to chain ID
  const contractAddress = listenerPayload.ContractAddress.toLowerCase();
  const chainId = getChainIdFromContract(contractAddress);

  if (!chainId) {
    throw new Error(
      `Unknown contract address: ${contractAddress}. ` +
        `Please add to CONTRACT_TO_CHAIN_MAP in listener-types.ts`
    );
  }

  // Extract decoded parameters
  const paramNames = listenerPayload.DecodedParametersNames;
  const paramValues = listenerPayload.DecodedParametersValues;

  // Validate arrays have same length
  if (paramNames.length !== paramValues.length) {
    throw new Error(
      `Parameter mismatch: ${paramNames.length} names vs ${paramValues.length} values`
    );
  }

  // Create parameter map for easier access
  const params: Record<string, string | number> = {};
  paramNames.forEach((name, index) => {
    params[name] = paramValues[index];
  });

  // Validate required parameters exist
  const requiredParams = ['nullifierHash', 'changeCommitment', 'actionHash', 'investAmount', 'timestamp', 'changeIndex'];
  for (const param of requiredParams) {
    if (!(param in params)) {
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // Parse block timestamp (ISO 8601 to Unix timestamp in seconds)
  const blockTimestamp = Math.floor(
    new Date(listenerPayload.BlockTimestamp).getTime() / 1000
  );

  // Build ActionExecutedPayload
  const adapted: ActionExecutedPayload = {
    eventId: listenerPayload.Id,
    chainId: chainId,
    vaultAddress: contractAddress,
    nullifierHash: params.nullifierHash as string,
    changeCommitment: params.changeCommitment as string,
    actionHash: params.actionHash as string,
    investAmount: params.investAmount as string,
    timestamp: parseInt(params.timestamp as string, 10),
    changeIndex: parseInt(params.changeIndex as string, 10),
    block: {
      number: listenerPayload.BlockNumber,
      hash: listenerPayload.BlockHash.toLowerCase(),
      timestamp: blockTimestamp,
    },
    transactionHash: listenerPayload.TransactionHash.toLowerCase(),
  };

  // Log successful transformation
  console.log(
    `[adapter] ✅ Adapted ActionExecuted event: ${adapted.transactionHash.slice(0, 10)}... changeIndex=${adapted.changeIndex}`
  );

  return adapted;
}

/**
 * Detect event type and adapt accordingly
 *
 * This is the main entry point for the adapter. It inspects the event signature
 * and routes to the appropriate transformation function.
 *
 * @param listenerPayload - Raw payload from blockchain listener
 * @returns Transformed payload or null if event type is not supported
 * @throws Error if transformation fails
 */
export function adaptListenerPayload(
  listenerPayload: ListenerEventPayload
): WebhookPayload | null {
  const eventSig = listenerPayload.EventSignature;

  console.log(`[adapter] Received event: ${eventSig} from tx ${listenerPayload.TransactionHash.slice(0, 10)}...`);

  // Deposit event - most common
  if (eventSig === 'Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)') {
    return adaptDepositEvent(listenerPayload);
  }

  // ActionExecuted event - DeFi actions (not yet implemented)
  if (eventSig === 'ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)') {
    return adaptActionExecutedEvent(listenerPayload);
  }

  // MerkleRootUpdated event - informational only, no processing needed
  if (eventSig === 'MerkleRootUpdated(bytes32,bytes32,uint256)') {
    console.log(
      `[adapter] ℹ️  MerkleRootUpdated event received (no processing needed). TX: ${listenerPayload.TransactionHash.slice(0, 10)}...`
    );
    return null;
  }

  // AnonymousWithdrawal event - informational only, no processing needed
  if (eventSig === 'AnonymousWithdrawal(bytes32,address,uint256,bytes32,uint256)') {
    console.log(
      `[adapter] ℹ️  AnonymousWithdrawal event received (no processing needed). TX: ${listenerPayload.TransactionHash.slice(0, 10)}...`
    );
    return null;
  }

  // Unknown event type - log and return null
  console.warn(
    `[adapter] ⚠️  Unknown event signature: ${eventSig}. Skipping event ${listenerPayload.Id}`
  );
  return null;
}

/**
 * Check if a payload is in listener format
 *
 * @param payload - Unknown payload object
 * @returns True if payload appears to be from listener
 */
export function isListenerFormat(payload: unknown): payload is ListenerEventPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  // Check for listener-specific fields
  return (
    'DecodedParametersNames' in obj &&
    'DecodedParametersValues' in obj &&
    'EventSignature' in obj &&
    'ContractAddress' in obj
  );
}
