import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient, getVaultByChainAndAddress } from '../_shared/utils/db.ts';

interface CommitmentInfoRequest {
  chainId: number;
  vaultAddress: string;
  commitment: string;
}

interface CommitmentInfoResponse {
  commitment: string;
  leafIndex: number;
  blockNumber: number;
  transactionHash: string;
  status: string;
  vaultId: string;
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
    const vaultAddress = url.searchParams.get('vaultAddress') || '';
    const commitment = url.searchParams.get('commitment') || '';

    // Validate parameters
    if (!chainId) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'chainId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vaultAddress) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'vaultAddress is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!commitment) {
      return new Response(
        JSON.stringify({ code: 'INVALID_PARAMS', message: 'commitment is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get vault
    const vault = await getVaultByChainAndAddress(chainId, vaultAddress);
    if (!vault) {
      return new Response(
        JSON.stringify({ code: 'NOT_FOUND', message: 'Vault not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query commitment info
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('processed_events')
      .select('leaf_index, block_number, event_id, status, vault_id')
      .eq('vault_id', vault.id)
      .eq('commitment_hash', commitment.toLowerCase())
      .eq('event_type', 'NewCommitment')
      .eq('status', 'confirmed')
      .single();

    if (error || !data) {
      return new Response(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: 'Commitment not found or not yet confirmed'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if leaf_index is null (old events before migration)
    if (data.leaf_index === null) {
      return new Response(
        JSON.stringify({
          code: 'NOT_FOUND',
          message: 'Commitment found but leafIndex not available (event pre-dates leafIndex tracking)'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response: CommitmentInfoResponse = {
      commitment,
      leafIndex: data.leaf_index,
      blockNumber: data.block_number,
      transactionHash: data.event_id, // eventId is the transaction hash
      status: data.status,
      vaultId: data.vault_id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Commitment info error:', error);

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
