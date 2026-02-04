/**
 * Unit Tests for Validator
 * 
 * Tests the webhook payload validation logic.
 */

import {
  validateWebhookPayload,
  validateDecodedParams,
  isWebhookPayload,
  parseAndValidateWebhookPayload,
  PayloadValidationError,
} from "../../src/models/webhook-processor/validator.ts";

Deno.test("validateWebhookPayload - valid payload", () => {
  const payload = {
    TransactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    LogIndex: 0,
    ContractAddress: "0x1234567890123456789012345678901234567890",
    BlockchainNetworkId: 1,
    DecodedParametersNames: ["commitment", "leafIndex"],
    DecodedParametersValues: ["0xabc", 5],
  };
  
  const result = validateWebhookPayload(payload);
  assertTrue(result.isValid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateWebhookPayload - invalid TransactionHash", () => {
  const payload = createValidPayload();
  payload.TransactionHash = "0x123"; // Too short
  
  const result = validateWebhookPayload(payload);
  assertFalse(result.isValid);
  assertTrue(result.errors.length > 0);
  assertEquals(result.errors[0].field, "TransactionHash");
});

Deno.test("validateWebhookPayload - invalid ContractAddress", () => {
  const payload = createValidPayload();
  payload.ContractAddress = "0x123"; // Too short
  
  const result = validateWebhookPayload(payload);
  assertFalse(result.isValid);
  assertTrue(result.errors.some(e => e.field === "ContractAddress"));
});

Deno.test("validateWebhookPayload - negative LogIndex", () => {
  const payload = createValidPayload();
  payload.LogIndex = -1;
  
  const result = validateWebhookPayload(payload);
  assertFalse(result.isValid);
  assertTrue(result.errors.some(e => e.field === "LogIndex"));
});

Deno.test("validateWebhookPayload - negative chainId", () => {
  const payload = createValidPayload();
  payload.BlockchainNetworkId = -1;
  
  const result = validateWebhookPayload(payload);
  assertFalse(result.isValid);
  assertTrue(result.errors.some(e => e.field === "BlockchainNetworkId"));
});

Deno.test("validateWebhookPayload - mismatched array lengths", () => {
  const payload = createValidPayload();
  payload.DecodedParametersNames = ["a", "b", "c"];
  payload.DecodedParametersValues = ["1"];
  
  const result = validateWebhookPayload(payload);
  assertFalse(result.isValid);
});

Deno.test("validateWebhookPayload - missing required fields", () => {
  const payload = {
    TransactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    // Missing other fields
  };
  
  const result = validateWebhookPayload(payload);
  assertFalse(result.isValid);
  assertTrue(result.errors.length >= 4);
});

Deno.test("validateWebhookPayload - optional BlockHash validation", () => {
  const payload = createValidPayload();
  payload.BlockHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  payload.BlockNumber = 12345;
  
  const result = validateWebhookPayload(payload);
  assertTrue(result.isValid);
});

Deno.test("validateDecodedParams - all required fields present", () => {
  const decoded = { commitment: "0xabc", leafIndex: 5 };
  const result = validateDecodedParams(decoded, ["commitment", "leafIndex"]);
  
  assertTrue(result.isValid);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateDecodedParams - missing required fields", () => {
  const decoded = { commitment: "0xabc" };
  const result = validateDecodedParams(decoded, ["commitment", "leafIndex"]);
  
  assertFalse(result.isValid);
  assertEquals(result.errors.length, 1);
});

Deno.test("isWebhookPayload - valid payload", () => {
  const payload = createValidPayload();
  assertTrue(isWebhookPayload(payload));
});

Deno.test("isWebhookPayload - null", () => {
  assertFalse(isWebhookPayload(null));
});

Deno.test("isWebhookPayload - missing DecodedParametersNames", () => {
  const payload = createValidPayload();
  delete (payload as Record<string, unknown>).DecodedParametersNames;
  assertFalse(isWebhookPayload(payload));
});

Deno.test("parseAndValidateWebhookPayload - valid JSON", () => {
  const json = JSON.stringify(createValidPayload());
  const result = parseAndValidateWebhookPayload(json);
  
  assertTrue(result.payload !== null);
  assertEquals(result.error, null);
});

Deno.test("parseAndValidateWebhookPayload - invalid JSON", () => {
  const result = parseAndValidateWebhookPayload("not valid json");
  
  assertTrue(result.payload === null);
  assertTrue(result.error !== null);
});

Deno.test("parseAndValidateWebhookPayload - invalid payload structure", () => {
  const result = parseAndValidateWebhookPayload('{"foo": "bar"}');
  
  assertTrue(result.payload === null);
  assertTrue(result.error !== null);
});

function createValidPayload() {
  return {
    TransactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    LogIndex: 0,
    ContractAddress: "0x1234567890123456789012345678901234567890",
    BlockchainNetworkId: 1,
    DecodedParametersNames: ["commitment", "leafIndex"],
    DecodedParametersValues: ["0xabc", 5],
  };
}

function assertTrue(value: boolean) {
  if (!value) throw new Error(`Expected true but got false`);
}

function assertFalse(value: boolean) {
  if (value) throw new Error(`Expected false but got true`);
}

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}
