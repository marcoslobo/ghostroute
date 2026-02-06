import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient(): ReturnType<typeof createClient> {
  if (!supabaseClient) {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    supabaseClient = createClient(url, serviceRoleKey);
  }

  return supabaseClient;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('vaults').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function getVaultByChainAndAddress(
  chainId: number,
  vaultAddress: string
): Promise<{ id: string; current_root: string | null; latest_block_number: number } | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('vaults')
    .select('id, current_root, latest_block_number')
    .eq('chain_id', chainId)
    .eq('vault_address', vaultAddress.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    current_root: data.current_root as string | null,
    latest_block_number: data.latest_block_number as number,
  };
}

export async function createVault(
  chainId: number,
  vaultAddress: string
): Promise<string> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('vaults')
    .insert({ chain_id: chainId, vault_address: vaultAddress })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create vault: ${error.message}`);
  }

  return data.id as string;
}

export async function getOrCreateVault(
  chainId: number,
  vaultAddress: string
): Promise<string> {
  const existing = await getVaultByChainAndAddress(chainId, vaultAddress);
  if (existing) {
    return existing.id;
  }
  return await createVault(chainId, vaultAddress);
}

export async function updateVaultRoot(
  vaultId: string,
  root: string,
  blockNumber: number
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('vaults')
    .update({
      current_root: root,
      latest_block_number: blockNumber,
    })
    .eq('id', vaultId);

  if (error) {
    throw new Error(`Failed to update vault root: ${error.message}`);
  }
}

export async function saveMerkleNode(
  vaultId: string,
  level: number,
  index: bigint,
  hash: string
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('merkle_nodes')
    .upsert(
      { vault_id: vaultId, level, index: index.toString(), hash },
      { onConflict: 'vault_id, level, index', ignoreDuplicates: true }
    );

  if (error) {
    throw new Error(`Failed to save Merkle node: ${error.message}`);
  }
}

export async function getMerkleNode(
  vaultId: string,
  level: number,
  index: bigint
): Promise<string | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('merkle_nodes')
    .select('hash')
    .eq('vault_id', vaultId)
    .eq('level', level)
    .eq('index', index.toString())
    .single();

  if (error || !data) {
    return null;
  }

  return data.hash as string;
}

export async function isEventProcessed(
  vaultId: string,
  eventId: string
): Promise<boolean> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('processed_events')
    .select('id')
    .eq('vault_id', vaultId)
    .eq('event_id', eventId)
    .single();

  return !error && !!data;
}

export async function recordProcessedEvent(
  vaultId: string,
  eventType: string,
  eventId: string,
  blockNumber: number,
  commitmentHash: string | null,
  nullifierHash: string | null,
  leafIndex?: number | null
): Promise<void> {
  const client = getSupabaseClient();

  const eventData: Record<string, any> = {
    vault_id: vaultId,
    event_type: eventType,
    event_id: eventId,
    block_number: blockNumber,
    commitment_hash: commitmentHash,
    nullifier_hash: nullifierHash,
    status: 'confirmed',
  };

  // Add leaf_index only for NewCommitment events
  if (leafIndex !== undefined && leafIndex !== null) {
    eventData.leaf_index = leafIndex;
  }

  const { error } = await client
    .from('processed_events')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record processed event: ${error.message}`);
  }
}

export async function revertEventsAfterBlock(
  vaultId: string,
  blockNumber: number
): Promise<number> {
  const client = getSupabaseClient();
  const { error, count } = await client
    .from('processed_events')
    .update({ status: 'reverted' })
    .eq('vault_id', vaultId)
    .gte('block_number', blockNumber)
    .eq('status', 'confirmed');

  if (error) {
    throw new Error(`Failed to revert events: ${error.message}`);
  }

  return count || 0;
}
