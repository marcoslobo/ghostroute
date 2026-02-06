import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getVaultByChainAndAddress } from '../_shared/utils/db.ts';

interface MerkleRootRequest {
  vaultId?: string;
  chainId: number;
  vaultAddress?: string;
}

interface MerkleRootResponse {
  vaultId: string;
  chainId: number;
  root: string;
  blockNumber: number;
  updatedAt: string;
}

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ code: 'METHOD_NOT_ALLOWED', message: 'Only GET method is allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const chainId = parseInt(url.searchParams.get('chainId') || '0');
    const vaultId = url.searchParams.get('vaultId') || '';
    const vaultAddress = url.searchParams.get('vaultAddress') || '';

    if (!chainId) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'chainId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vaultId && !vaultAddress) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'vaultId or vaultAddress is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let vault;

    if (vaultId) {
      const { getSupabaseClient } = await import('../_shared/utils/db.ts');
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('vaults')
        .select('id, chain_id, current_root, latest_block_number, updated_at')
        .eq('id', vaultId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ code: 'NOT_FOUND', message: 'Vault not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      vault = data;
    } else {
      const { getVaultByChainAndAddress } = await import('../_shared/utils/db.ts');
      vault = await getVaultByChainAndAddress(chainId, vaultAddress);

      if (!vault) {
        return new Response(
          JSON.stringify({ code: 'NOT_FOUND', message: 'Vault not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const response: MerkleRootResponse = {
      vaultId: vault.id,
      chainId: vault.chain_id || chainId,
      root: vault.current_root || '0x0',
      blockNumber: vault.latest_block_number || 0,
      updatedAt: vault.updated_at || new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Merkle root error:', error);

    return new Response(
      JSON.stringify({
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

serve(handleRequest, { port: 3001 });
