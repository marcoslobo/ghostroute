/**
 * Unit Tests for Merkle Updater
 * 
 * Tests the Merkle tree update logic for deposits and ActionExecuted events.
 */

import {
  determineEventType,
} from "../../src/models/webhook-processor/event-router.ts";
import { DecodedParamsMap } from "../../src/models/webhook-processor/types.ts";

Deno.test("determineEventType - Deposit event", () => {
  const decoded: DecodedParamsMap = {
    commitment: "0xabc",
    leafIndex: 5,
  };
  
  const result = determineEventType(decoded);
  assertEquals(result, "Deposit");
});

Deno.test("determineEventType - ActionExecuted event", () => {
  const decoded: DecodedParamsMap = {
    nullifierHash: "0xabc",
    changeCommitment: "0xdef",
    changeIndex: 10,
  };
  
  const result = determineEventType(decoded);
  assertEquals(result, "ActionExecuted");
});

Deno.test("determineEventType - Unknown event", () => {
  const decoded: DecodedParamsMap = {
    someField: "someValue",
  };
  
  const result = determineEventType(decoded);
  assertEquals(result, "Unknown");
});

Deno.test("determineEventType - Both deposit and ActionExecuted fields", () => {
  const decoded: DecodedParamsMap = {
    commitment: "0xabc",
    leafIndex: 5,
    nullifierHash: "0xdef",
    changeCommitment: "0xghi",
    changeIndex: 10,
  };
  
  // Should prioritize ActionExecuted when both are present
  const result = determineEventType(decoded);
  assertEquals(result, "ActionExecuted");
});

Deno.test("determineEventType - ERC20Withdrawal event", () => {
  const decoded: DecodedParamsMap = {
    nullifierHash: "0xabc",
    changeCommitment: "0xdef",
    changeIndex: 10,
    token: "0x1234567890abcdef1234567890abcdef12345678",
    recipient: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  };
  
  const result = determineEventType(decoded);
  assertEquals(result, "ERC20Withdrawal");
});

Deno.test("determineEventType - ERC20Withdrawal takes priority over ActionExecuted", () => {
  const decoded: DecodedParamsMap = {
    nullifierHash: "0xabc",
    changeCommitment: "0xdef",
    changeIndex: 10,
    token: "0x1234567890abcdef1234567890abcdef12345678",
    recipient: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    // Also has ActionExecuted fields (subset of ERC20Withdrawal)
  };
  
  // Should prioritize ERC20Withdrawal over ActionExecuted
  const result = determineEventType(decoded);
  assertEquals(result, "ERC20Withdrawal");
});

Deno.test("determineEventType - partial ERC20Withdrawal fields falls back to ActionExecuted", () => {
  const decoded: DecodedParamsMap = {
    nullifierHash: "0xabc",
    changeCommitment: "0xdef",
    changeIndex: 10,
    token: "0x1234567890abcdef1234567890abcdef12345678",
    // Missing "recipient" - not a full ERC20Withdrawal
  };
  
  // Should fall back to ActionExecuted since ERC20Withdrawal fields are incomplete
  const result = determineEventType(decoded);
  assertEquals(result, "ActionExecuted");
});

Deno.test("determineEventType - empty params returns Unknown", () => {
  const decoded: DecodedParamsMap = {};
  
  const result = determineEventType(decoded);
  assertEquals(result, "Unknown");
});

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}
