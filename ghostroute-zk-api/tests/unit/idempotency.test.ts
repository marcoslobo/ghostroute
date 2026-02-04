/**
 * Unit Tests for Idempotency Service
 * 
 * Tests the idempotency checking and recording logic.
 */

import { checkIdempotency, getIdempotencyKey } from "../../src/models/webhook-processor/idempotency.ts";

Deno.test("getIdempotencyKey - formats correctly", () => {
  const key = getIdempotencyKey({
    TransactionHash: "0x123",
    LogIndex: 0,
    ContractAddress: "0x456",
    BlockchainNetworkId: 1,
    DecodedParametersNames: [],
    DecodedParametersValues: [],
  });
  
  assertEquals(key, "0x123:0");
});

Deno.test("getIdempotencyKey - different log indices", () => {
  const key1 = getIdempotencyKey({
    TransactionHash: "0x123",
    LogIndex: 0,
    ContractAddress: "0x456",
    BlockchainNetworkId: 1,
    DecodedParametersNames: [],
    DecodedParametersValues: [],
  });
  
  const key2 = getIdempotencyKey({
    TransactionHash: "0x123",
    LogIndex: 1,
    ContractAddress: "0x456",
    BlockchainNetworkId: 1,
    DecodedParametersNames: [],
    DecodedParametersValues: [],
  });
  
  assertNotEquals(key1, key2);
});

Deno.test("getIdempotencyKey - same tx, different logs", () => {
  const txHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  
  const key1 = getIdempotencyKey({
    TransactionHash: txHash,
    LogIndex: 0,
    ContractAddress: "0x456",
    BlockchainNetworkId: 1,
    DecodedParametersNames: [],
    DecodedParametersValues: [],
  });
  
  const key2 = getIdempotencyKey({
    TransactionHash: txHash,
    LogIndex: 1,
    ContractAddress: "0x456",
    BlockchainNetworkId: 1,
    DecodedParametersNames: [],
    DecodedParametersValues: [],
  });
  
  const key3 = getIdempotencyKey({
    TransactionHash: txHash,
    LogIndex: 2,
    ContractAddress: "0x456",
    BlockchainNetworkId: 1,
    DecodedParametersNames: [],
    DecodedParametersValues: [],
  });
  
  assertNotEquals(key1, key2);
  assertNotEquals(key2, key3);
  assertNotEquals(key1, key3);
});

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function assertNotEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    throw new Error(`Expected values to be different but got ${JSON.stringify(actual)}`);
  }
}
