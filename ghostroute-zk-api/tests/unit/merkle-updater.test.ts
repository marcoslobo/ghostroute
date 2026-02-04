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

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}
