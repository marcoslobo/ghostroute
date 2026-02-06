import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, getVaultByChainAndAddress } from '../_shared/utils/db.ts';
import { hashToString } from '../_shared/merkle/hasher.ts';

interface MerklePathRequest {
  vaultId?: string;
  chainId: number;
  vaultAddress?: string;
  leafIndex: number;
}

interface MerklePathResponse {
  vaultId: string;
  chainId: number;
  leafIndex: number;
  root: string;
  path: {
    level: number;
    hash: string;
    side: 'left' | 'right';
  }[];
  proofGeneratedAt: string;
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
    const leafIndex = parseInt(url.searchParams.get('leafIndex') || '0');

    if (!chainId) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'chainId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (leafIndex < 0 || leafIndex >= Math.pow(2, 20)) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'leafIndex must be between 0 and 2^20 - 1' }),
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
    let actualVaultId: string;

    if (vaultId) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('vaults')
        .select('id, chain_id, current_root')
        .eq('id', vaultId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ code: 'NOT_FOUND', message: 'Vault not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      vault = data;
      actualVaultId = vaultId;
    } else {
      const vaultData = await getVaultByChainAndAddress(chainId, vaultAddress);

      if (!vaultData) {
        return new Response(
          JSON.stringify({ code: 'NOT_FOUND', message: 'Vault not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      vault = vaultData;
      actualVaultId = vaultData.id;
    }

    const client = getSupabaseClient();

    const { data: leafData, error: leafError } = await client
      .from('merkle_nodes')
      .select('hash')
      .eq('vault_id', actualVaultId)
      .eq('level', 0)
      .eq('index', leafIndex.toString())
      .single();

    const leafHash = leafData?.hash;
    const path: { level: number; hash: string; side: 'left' | 'right' }[] = [];

    if (leafHash) {
      for (let level = 0; level < 20; level++) {
        const siblingIndex = BigInt(leafIndex) ^ BigInt(1) << BigInt(level);
        const { data: siblingData } = await client
          .from('merkle_nodes')
          .select('hash')
          .eq('vault_id', actualVaultId)
          .eq('level', level)
          .eq('index', siblingIndex.toString())
          .single();

        const bit = (BigInt(leafIndex) >> BigInt(level)) & BigInt(1);
        const side: 'left' | 'right' = bit === BigInt(0) ? 'right' : 'left';

        path.push({
          level: level + 1,
          hash: siblingData?.hash || hashToString(BigInt(0)),
          side,
        });
      }
    }

    const response: MerklePathResponse = {
      vaultId: actualVaultId,
      chainId: vault.chain_id || chainId,
      leafIndex,
      root: vault.current_root || hashToString(BigInt(0)),
      path,
      proofGeneratedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Merkle path error:', error);

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
