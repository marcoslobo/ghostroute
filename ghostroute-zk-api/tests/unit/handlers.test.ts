import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  NewCommitmentPayload,
  NullifierSpentPayload,
  isNewCommitment,
  isNullifierSpent,
  validateNewCommitment,
  validateNullifierSpent,
} from '../../src/handlers/webhook.ts';

Deno.test('webhook - isNewCommitment identifies NewCommitment payloads', () => {
  const payload: NewCommitmentPayload = {
    eventId: 'evt_123',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    commitment: {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      index: 42,
      value: '1000000000000000000',
    },
    block: {
      number: 18500000,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: 1699999999,
    },
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  };

  assert(isNewCommitment(payload));
  assert(!isNullifierSpent(payload));
});

Deno.test('webhook - isNullifierSpent identifies NullifierSpent payloads', () => {
  const payload: NullifierSpentPayload = {
    eventId: 'evt_456',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    nullifier: {
      hash: '0xdeadbeef1234567890deadbeef1234567890deadbeef1234567890deadbeef',
      commitmentIndex: 42,
    },
    block: {
      number: 18500100,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: 1700000000,
    },
    transactionHash: '0xefgh5678...',
  };

  assert(isNullifierSpent(payload));
  assert(!isNewCommitment(payload));
});

Deno.test('webhook - validateNewCommitment accepts valid payload', () => {
  const payload: NewCommitmentPayload = {
    eventId: 'evt_123',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    commitment: {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      index: 42,
      value: '1000000000000000000',
    },
    block: {
      number: 18500000,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: 1699999999,
    },
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  };

  let error: Error | undefined;
  try {
    validateNewCommitment(payload);
  } catch (e) {
    error = e as Error;
  }
  assertEquals(error, undefined);
});

Deno.test('webhook - validateNewCommitment throws on missing eventId', () => {
  const payload = {
    eventId: '',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    commitment: {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      index: 42,
      value: '1000000000000000000',
    },
    block: { number: 18500000, hash: '0x1234', timestamp: 1699999999 },
    transactionHash: '0xabcd',
  } as any;

  assertThrows(() => validateNewCommitment(payload), Error, 'Invalid eventId');
});

Deno.test('webhook - validateNewCommitment throws on invalid vaultAddress', () => {
  const payload = {
    eventId: 'evt_123',
    chainId: 1,
    vaultAddress: '0x123',
    commitment: {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      index: 42,
      value: '1000000000000000000',
    },
    block: { number: 18500000, hash: '0x1234', timestamp: 1699999999 },
    transactionHash: '0xabcd',
  } as any;

  assertThrows(() => validateNewCommitment(payload), Error, 'Invalid vaultAddress');
});

Deno.test('webhook - validateNewCommitment throws on invalid commitment hash', () => {
  const payload = {
    eventId: 'evt_123',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    commitment: {
      hash: '0x123',
      index: 42,
      value: '1000000000000000000',
    },
    block: { number: 18500000, hash: '0x1234', timestamp: 1699999999 },
    transactionHash: '0xabcd',
  } as any;

  assertThrows(() => validateNewCommitment(payload), Error, 'Invalid commitment hash');
});

Deno.test('webhook - validateNullifierSpent accepts valid payload', () => {
  const payload: NullifierSpentPayload = {
    eventId: 'evt_456',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    nullifier: {
      hash: '0xdeadbeef1234567890deadbeef1234567890deadbeef1234567890abcdefabcd',
      commitmentIndex: 42,
    },
    block: {
      number: 18500100,
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: 1700000000,
    },
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  };

  let error: Error | undefined;
  try {
    validateNullifierSpent(payload);
  } catch (e) {
    error = e as Error;
  }
  assertEquals(error, undefined);
});

Deno.test('webhook - validateNullifierSpent throws on invalid nullifier hash', () => {
  const payload = {
    eventId: 'evt_456',
    chainId: 1,
    vaultAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
    nullifier: {
      hash: '0x123',
      commitmentIndex: 42,
    },
    block: { number: 18500100, hash: '0x1234', timestamp: 1700000000 },
    transactionHash: '0xefgh',
  } as any;

  assertThrows(() => validateNullifierSpent(payload), Error, 'Invalid nullifier hash');
});
