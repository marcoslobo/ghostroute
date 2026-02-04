/**
 * Webhook Payload Validator
 * 
 * Validates webhook payload structure and field formats
 * including regex validation for Ethereum addresses and hashes.
 */

import {
  WebhookPayload,
  DecodedParamsMap,
} from "./types.ts";

const TRANSACTION_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const BLOCK_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;
const EVENT_SIGNATURE_REGEX = /^0x[0-9a-fA-F]{64}$/;

/**
 * Validation error class with details.
 */
export class PayloadValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown,
  ) {
    super(message);
    this.name = "PayloadValidationError";
  }
}

/**
 * Validates a complete webhook payload.
 * 
 * @param payload - The webhook payload to validate
 * @returns ValidationResult with isValid flag and any errors
 */
export function validateWebhookPayload(
  payload: WebhookPayload,
): { isValid: boolean; errors: PayloadValidationError[] } {
  const errors: PayloadValidationError[] = [];

  // Required fields validation
  if (!payload.TransactionHash) {
    errors.push(new PayloadValidationError(
      "TransactionHash is required",
      "TransactionHash",
    ));
  } else if (!TRANSACTION_HASH_REGEX.test(payload.TransactionHash)) {
    errors.push(new PayloadValidationError(
      "TransactionHash must be 66 characters (0x prefix + 64 hex chars)",
      "TransactionHash",
      payload.TransactionHash,
    ));
  }

  if (payload.LogIndex === undefined || payload.LogIndex === null) {
    errors.push(new PayloadValidationError(
      "LogIndex is required",
      "LogIndex",
    ));
  } else if (
    typeof payload.LogIndex !== "number" ||
    !Number.isInteger(payload.LogIndex) ||
    payload.LogIndex < 0
  ) {
    errors.push(new PayloadValidationError(
      "LogIndex must be a non-negative integer",
      "LogIndex",
      payload.LogIndex,
    ));
  }

  if (!payload.ContractAddress) {
    errors.push(new PayloadValidationError(
      "ContractAddress is required",
      "ContractAddress",
    ));
  } else if (!ADDRESS_REGEX.test(payload.ContractAddress)) {
    errors.push(new PayloadValidationError(
      "ContractAddress must be 42 characters (0x prefix + 40 hex chars)",
      "ContractAddress",
      payload.ContractAddress,
    ));
  }

  if (payload.BlockchainNetworkId === undefined || payload.BlockchainNetworkId === null) {
    errors.push(new PayloadValidationError(
      "BlockchainNetworkId is required",
      "BlockchainNetworkId",
    ));
  } else if (
    typeof payload.BlockchainNetworkId !== "number" ||
    !Number.isInteger(payload.BlockchainNetworkId) ||
    payload.BlockchainNetworkId < 0
  ) {
    errors.push(new PayloadValidationError(
      "BlockchainNetworkId must be a non-negative integer",
      "BlockchainNetworkId",
      payload.BlockchainNetworkId,
    ));
  }

  if (!payload.DecodedParametersNames || !Array.isArray(payload.DecodedParametersNames)) {
    errors.push(new PayloadValidationError(
      "DecodedParametersNames is required and must be an array",
      "DecodedParametersNames",
    ));
  }

  if (!payload.DecodedParametersValues || !Array.isArray(payload.DecodedParametersValues)) {
    errors.push(new PayloadValidationError(
      "DecodedParametersValues is required and must be an array",
      "DecodedParametersValues",
    ));
  }

  // Array length matching
  if (
    payload.DecodedParametersNames &&
    payload.DecodedParametersValues &&
    payload.DecodedParametersNames.length !== payload.DecodedParametersValues.length
  ) {
    errors.push(new PayloadValidationError(
      `DecodedParametersNames (${payload.DecodedParametersNames.length}) and DecodedParametersValues (${payload.DecodedParametersValues.length}) must have equal length`,
      "DecodedParametersNames",
    ));
  }

  // Optional fields validation
  if (payload.BlockNumber !== undefined) {
    if (
      typeof payload.BlockNumber !== "number" ||
      !Number.isInteger(payload.BlockNumber) ||
      payload.BlockNumber < 0
    ) {
      errors.push(new PayloadValidationError(
        "BlockNumber must be a non-negative integer if provided",
        "BlockNumber",
        payload.BlockNumber,
      ));
    }
  }

  if (payload.BlockHash && !BLOCK_HASH_REGEX.test(payload.BlockHash)) {
    errors.push(new PayloadValidationError(
      "BlockHash must be 66 characters (0x prefix + 64 hex chars) if provided",
      "BlockHash",
      payload.BlockHash,
    ));
  }

  if (payload.EventSignature && !EVENT_SIGNATURE_REGEX.test(payload.EventSignature)) {
    errors.push(new PayloadValidationError(
      "EventSignature must be 66 characters (0x prefix + 64 hex chars) if provided",
      "EventSignature",
      payload.EventSignature,
    ));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a decoded parameters map for required fields.
 * 
 * @param decoded - The decoded parameters map
 * @param requiredFields - List of required field names
 * @returns ValidationResult with isValid flag and any errors
 */
export function validateDecodedParams(
  decoded: DecodedParamsMap,
  requiredFields: string[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in decoded)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard to check if a value is a valid WebhookPayload.
 */
export function isWebhookPayload(value: unknown): value is WebhookPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  
  return (
    typeof payload.TransactionHash === "string" &&
    typeof payload.LogIndex === "number" &&
    typeof payload.ContractAddress === "string" &&
    typeof payload.BlockchainNetworkId === "number" &&
    Array.isArray(payload.DecodedParametersNames) &&
    Array.isArray(payload.DecodedParametersValues)
  );
}

/**
 * Safely parses and validates a raw JSON payload.
 * 
 * @param rawJson - Raw JSON string from the webhook
 * @returns Parsed and validated payload or null if invalid
 */
export function parseAndValidateWebhookPayload(
  rawJson: string,
): { payload: WebhookPayload | null; error: string | null } {
  try {
    const parsed = JSON.parse(rawJson);
    
    if (!isWebhookPayload(parsed)) {
      return {
        payload: null,
        error: "Invalid payload structure: missing required fields",
      };
    }

    const validation = validateWebhookPayload(parsed);
    
    if (!validation.isValid) {
      const errorMessages = validation.errors
        .map((e) => e.message)
        .join("; ");
      return {
        payload: null,
        error: `Validation failed: ${errorMessages}`,
      };
    }

    return {
      payload: parsed,
      error: null,
    };
  } catch (error) {
    return {
      payload: null,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}
