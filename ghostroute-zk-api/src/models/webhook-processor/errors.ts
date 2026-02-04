/**
 * Error Types and Handler
 * 
 * Defines custom error types for the webhook processor
 * with structured error information for debugging.
 */

export class PayloadValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown,
    public details?: string[],
  ) {
    super(message);
    this.name = "PayloadValidationError";
  }
}

export class IdempotencyError extends Error {
  constructor(
    message: string,
    public transactionHash: string,
    public logIndex: number,
  ) {
    super(message);
    this.name = "IdempotencyError";
  }
}

export class MerkleUpdateError extends Error {
  constructor(
    message: string,
    public operation: "insert" | "invalidate" | "lookup",
    public vaultAddress?: string,
    public chainId?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "MerkleUpdateError";
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class EventProcessingError extends Error {
  constructor(
    message: string,
    public eventType: string,
    public transactionHash: string,
    public logIndex: number,
    public phase: "validation" | "idempotency" | "routing" | "processing" | "recording",
    public details?: unknown,
  ) {
    super(message);
    this.name = "EventProcessingError";
  }
}

export type ProcessorError =
  | PayloadValidationError
  | IdempotencyError
  | MerkleUpdateError
  | DatabaseError
  | EventProcessingError;

/**
 * Check if an error is a ProcessorError.
 */
export function isProcessorError(error: unknown): error is ProcessorError {
  return (
    error instanceof PayloadValidationError ||
    error instanceof IdempotencyError ||
    error instanceof MerkleUpdateError ||
    error instanceof DatabaseError ||
    error instanceof EventProcessingError
  );
}

/**
 * Get a user-friendly error message.
 */
export function getErrorMessage(error: unknown): string {
  if (isProcessorError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unknown error occurred";
}

/**
 * Get error code for HTTP responses.
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof PayloadValidationError) return "VALIDATION_ERROR";
  if (error instanceof IdempotencyError) return "IDEMPOTENCY_ERROR";
  if (error instanceof MerkleUpdateError) return "MERKLE_ERROR";
  if (error instanceof DatabaseError) return "DATABASE_ERROR";
  if (error instanceof EventProcessingError) return "PROCESSING_ERROR";
  if (error instanceof Error) {
    if (error.message.includes("JSON")) return "PARSE_ERROR";
    return "INTERNAL_ERROR";
  }
  return "UNKNOWN_ERROR";
}

/**
 * Get HTTP status code for error.
 */
export function getHttpStatus(error: unknown): number {
  if (error instanceof PayloadValidationError) return 400;
  if (error instanceof IdempotencyError) return 409;
  if (error instanceof MerkleUpdateError) return 422;
  if (error instanceof DatabaseError) return 503;
  if (error instanceof EventProcessingError) return 500;
  if (error instanceof Error && error.message.includes("JSON")) return 400;
  return 500;
}
