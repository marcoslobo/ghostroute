import { assert, assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  hashToString,
  stringToHash,
  hashTwo,
  hashFour,
  validateHash,
} from '../../src/merkle/hasher.ts';

Deno.test('hasher - hashToString converts bigint to hex string', () => {
  const hash = BigInt(123456789);
  const result = hashToString(hash);
  assert(result.startsWith('0x'));
  assertEquals(result.length, 66);
});

Deno.test('hasher - stringToHash converts hex string to bigint', () => {
  const hex = '0x000000000000000000000000000000000000000000000000000000000000007b';
  const result = stringToHash(hex);
  assertEquals(result, BigInt(123));
});

Deno.test('hasher - hashTwo computes poseidon hash of two values', () => {
  const a = BigInt(1);
  const b = BigInt(2);
  const result = hashTwo(a, b);
  assert(result > BigInt(0));
});

Deno.test('hasher - hashFour computes poseidon hash of four values', () => {
  const a = BigInt(1);
  const b = BigInt(2);
  const c = BigInt(3);
  const d = BigInt(4);
  const result = hashFour(a, b, c, d);
  assert(result > BigInt(0));
});

Deno.test('hasher - validateHash validates hash format', () => {
  const validHash = BigInt('0x' + 'a'.repeat(64));
  assert(validateHash(validHash));
});

Deno.test('hasher - hashTwo is deterministic', () => {
  const a = BigInt(42);
  const b = BigInt(123);
  const result1 = hashTwo(a, b);
  const result2 = hashTwo(a, b);
  assertEquals(result1, result2);
});

Deno.test('hasher - hashTwo is order-sensitive', () => {
  const a = BigInt(42);
  const b = BigInt(123);
  const result1 = hashTwo(a, b);
  const result2 = hashTwo(b, a);
  assert(result1 !== result2);
});
