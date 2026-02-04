/**
 * Unit Tests for Mapper
 * 
 * Tests the dynamic parameter mapping utility.
 */

import { mapParams, mapParamsWithValidation, tryMapParams } from "../../src/models/webhook-processor/mapper.ts";

Deno.test("mapParams - empty arrays", () => {
  const result = mapParams([], []);
  assertEquals(result, {});
});

Deno.test("mapParams - single element", () => {
  const result = mapParams(["key"], ["value"]);
  assertEquals(result, { key: "value" });
});

Deno.test("mapParams - multiple elements", () => {
  const names = ["commitment", "leafIndex", "nullifierHash"];
  const values = ["0xabc123", 5, "0xdef456"];
  const result = mapParams(names, values);
  
  assertEquals(result.commitment, "0xabc123");
  assertEquals(result.leafIndex, 5);
  assertEquals(result.nullifierHash, "0xdef456");
});

Deno.test("mapParams - type preservation", () => {
  const names = ["stringVal", "numberVal", "boolVal", "arrayVal", "objectVal"];
  const values = ["text", 42, true, [1, 2, 3], { a: 1 }];
  const result = mapParams(names, values);
  
  assertEquals(typeof result.stringVal, "string");
  assertEquals(typeof result.numberVal, "number");
  assertEquals(typeof result.boolVal, "boolean");
  assertArrayIncludes(result.arrayVal as unknown[], [1, 2, 3]);
  assertEquals((result.objectVal as Record<string, unknown>).a, 1);
});

Deno.test("mapParams - throws on length mismatch", () => {
  assertThrows(() => mapParams(["a", "b"], ["value"]));
});

Deno.test("mapParams - throws on null name", () => {
  assertThrows(() => mapParams([null as unknown as string], ["value"]));
});

Deno.test("mapParamsWithValidation - missing required field", () => {
  const names = ["commitment", "leafIndex"];
  const values = ["0xabc", 5];
  
  assertThrows(() => mapParamsWithValidation(names, values, ["nullifierHash"]));
});

Deno.test("mapParamsWithValidation - all required fields present", () => {
  const names = ["commitment", "leafIndex", "nullifierHash"];
  const values = ["0xabc", 5, "0xdef"];
  
  const result = mapParamsWithValidation(names, values, ["commitment", "nullifierHash"]);
  assertEquals(result.commitment, "0xabc");
  assertEquals(result.nullifierHash, "0xdef");
});

Deno.test("tryMapParams - returns null on mismatch", () => {
  const result = tryMapParams(["a", "b"], ["value"]);
  assertEquals(result, null);
});

Deno.test("tryMapParams - returns mapped object on success", () => {
  const result = tryMapParams(["key"], ["value"]);
  assertEquals(result, { key: "value" });
});

function assertEquals<T>(actual: T, expected: T) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function assertThrows(fn: () => void) {
  try {
    fn();
    throw new Error("Expected function to throw");
  } catch (e) {
    if (e instanceof Error && e.message === "Expected function to throw") {
      throw e;
    }
  }
}

function assertArrayIncludes<T>(arr: T[], values: T[]) {
  for (const v of values) {
    if (!arr.includes(v)) {
      throw new Error(`Array ${JSON.stringify(arr)} does not include ${JSON.stringify(v)}`);
    }
  }
}
