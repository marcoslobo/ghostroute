/**
 * Listener Payload Type Definitions
 *
 * Defines interfaces for blockchain event payloads received from external listeners.
 * These listeners monitor on-chain events and forward them to our webhook endpoint.
 */

/**
 * Raw blockchain event payload from external listener service
 *
 * This is the actual format sent by the listener after decoding blockchain events.
 */
export interface ListenerEventPayload {
  /** Unique event identifier from listener */
  Id: string;

  /** Optional idempotency key */
  IdempotencyKey: string;

  /** Listener's internal network identifier (not the same as chain ID) */
  BlockchainNetworkId: number;

  /** Transaction hash containing this event */
  TransactionHash: string;

  /** Index of this log entry within the transaction */
  LogIndex: number;

  /** Smart contract address that emitted the event */
  ContractAddress: string;

  /** Event signature (e.g., "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)") */
  EventSignature: string;

  /** Event topic hashes (indexed parameters) */
  Topic0: string;
  Topic1: string | null;
  Topic2: string | null;
  Topic3: string | null;

  /** Event data (non-indexed parameters) */
  Data: string;

  /** Block containing this event */
  BlockNumber: number;
  BlockHash: string;
  BlockTimestamp: string; // ISO 8601 format

  /** When listener processed this event */
  ProcessedAt: string;

  /** Transaction participants (listener-specific fields) */
  Sender: string;
  Receiver: string;
  Amount: number;

  /** Raw event data from blockchain (JSON-encoded) */
  RawData: string;

  /** Decoded event parameters */
  DecodedParametersNames: string[];
  DecodedParametersValues: (string | number)[];

  /** How the event was decoded */
  DecodingMethod: string;

  /** Transaction hash (duplicate of TransactionHash) */
  Hash: string;
}

/**
 * Mapping of contract addresses to chain IDs
 *
 * Strategy: Use contract address instead of listener's BlockchainNetworkId
 * because contract addresses are universal and reliable across all systems.
 *
 * When deploying to new networks, add new entries here:
 * - Key: Contract address (lowercase)
 * - Value: Standard chain ID (e.g., 1 for mainnet, 11155111 for Sepolia)
 */
export const CONTRACT_TO_CHAIN_MAP: Record<string, number> = {
  // Sepolia Testnet
  '0xc0145061c0c09177df754821cc64ca67e7bf27d1': 11155111,

  // Add other deployments as needed:
  // '0x...': 1, // Ethereum Mainnet
  // '0x...': 137, // Polygon
};

/**
 * Get chain ID from contract address
 *
 * @param contractAddress - Contract address (case-insensitive)
 * @returns Chain ID or undefined if not found
 */
export function getChainIdFromContract(contractAddress: string): number | undefined {
  return CONTRACT_TO_CHAIN_MAP[contractAddress.toLowerCase()];
}
