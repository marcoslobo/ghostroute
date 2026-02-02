import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface TestContext {
  vaultId: string;
  cleanup: () => Promise<void>;
}

async function createTestVault(): Promise<TestContext> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_or_create_vault`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      p_chain_id: 1,
      p_vault_address: '0x' + 'a'.repeat(40),
    }),
  });

  const result = await response.json();
  const vaultId = result;

  return {
    vaultId,
    cleanup: async () => {
      await fetch(`${SUPABASE_URL}/rest/v1/vaults?id=eq.${vaultId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      });
    },
  };
}

Deno.test('integration - webhook accepts valid NewCommitment payload', async () => {
  const { vaultId, cleanup } = await createTestVault();

  try {
    const payload = {
      eventType: 'NewCommitment',
      eventId: `test_evt_${Date.now()}`,
      chainId: 1,
      vaultAddress: '0x' + 'a'.repeat(40),
      commitment: {
        hash: '0x' + 'b'.repeat(64),
        index: 0,
        value: '1000000000000000000',
      },
      block: {
        number: 18500000,
        hash: '0x' + 'c'.repeat(64),
        timestamp: 1699999999,
      },
      transactionHash: '0x' + 'd'.repeat(64),
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    assertEquals(response.status, 200);
    const result = await response.json();
    assertEquals(result.received, true);
    assertEquals(result.status, 'accepted');
  } finally {
    await cleanup();
  }
});

Deno.test('integration - webhook rejects duplicate payload', async () => {
  const { vaultId, cleanup } = await createTestVault();

  try {
    const eventId = `test_duplicate_${Date.now()}`;
    const payload = {
      eventType: 'NewCommitment',
      eventId,
      chainId: 1,
      vaultAddress: '0x' + 'a'.repeat(40),
      commitment: {
        hash: '0x' + 'b'.repeat(64),
        index: 1,
        value: '1000000000000000000',
      },
      block: {
        number: 18500001,
        hash: '0x' + 'c'.repeat(64),
        timestamp: 1699999999,
      },
      transactionHash: '0x' + 'd'.repeat(64),
    };

    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEquals(response1.status, 200);

    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEquals(response2.status, 409);
    const result = await response2.json();
    assertEquals(result.status, 'duplicate');
  } finally {
    await cleanup();
  }
});

Deno.test('integration - webhook accepts valid NullifierSpent payload', async () => {
  const { vaultId, cleanup } = await createTestVault();

  try {
    const payload = {
      eventType: 'NullifierSpent',
      eventId: `test_nullifier_${Date.now()}`,
      chainId: 1,
      vaultAddress: '0x' + 'a'.repeat(40),
      nullifier: {
        hash: '0x' + 'deadbeef'.repeat(8),
        commitmentIndex: 0,
      },
      block: {
        number: 18500002,
        hash: '0x' + 'c'.repeat(64),
        timestamp: 1700000000,
      },
      transactionHash: '0x' + 'd'.repeat(64),
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assertEquals(response.status, 200);
    const result = await response.json();
    assertEquals(result.received, true);
    assertEquals(result.status, 'accepted');
  } finally {
    await cleanup();
  }
});

Deno.test('integration - merkle-root returns vault root', async () => {
  const { vaultId, cleanup } = await createTestVault();

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/merkle-root?chainId=1&vaultId=${vaultId}`,
      { method: 'GET' }
    );

    assertEquals(response.status, 200);
    const result = await response.json();
    assertEquals(result.vaultId, vaultId);
    assertEquals(typeof result.root, 'string');
    assertEquals(typeof result.blockNumber, 'number');
  } finally {
    await cleanup();
  }
});

Deno.test('integration - health endpoint returns status', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
    method: 'GET',
  });

  assertEquals(response.status, 200);
  const result = await response.json();
  assertEquals(typeof result.status, 'string');
  assertEquals(typeof result.version, 'string');
  assertEquals(typeof result.uptime, 'number');
  assertEquals(typeof result.checks.database, 'boolean');
});
