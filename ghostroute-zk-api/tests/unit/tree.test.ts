import { assert, assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { hashToString } from '../../src/merkle/hasher.ts';

Deno.test('tree - hashToString produces valid hex output', () => {
  const hash = hashToString(BigInt(123456789));
  assert(hash.startsWith('0x'));
  assertEquals(hash.length, 66);
});

Deno.test('tree - hashToString zero value produces correct format', () => {
  const hash = hashToString(BigInt(0));
  assertEquals(hash, '0x' + '0'.repeat(64));
});
