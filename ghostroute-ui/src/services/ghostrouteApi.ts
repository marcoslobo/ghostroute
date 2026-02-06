/**
 * GhostRoute ZK API Client
 *
 * Connects to the deployed Supabase Edge Functions API for:
 * - Merkle path generation
 * - Merkle root queries
 * - Health checks
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface MerklePathResponse {
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

export interface MerkleRootResponse {
  vaultId: string;
  chainId: number;
  root: string;
  blockNumber: number;
  updatedAt: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  checks: {
    database: boolean;
    merkleTree: boolean;
  };
  uptime: number;
}

/**
 * Get Merkle path for a leaf index
 */
export async function getMerklePath(
  chainId: number,
  vaultAddress: string,
  leafIndex: number
): Promise<MerklePathResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  }

  const url = new URL(`${SUPABASE_URL}/functions/v1/merkle-path`);
  url.searchParams.set('chainId', chainId.toString());
  url.searchParams.set('vaultAddress', vaultAddress);
  url.searchParams.set('leafIndex', leafIndex.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to get Merkle path: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get current Merkle root for a vault
 */
export async function getMerkleRoot(
  chainId: number,
  vaultAddress: string
): Promise<MerkleRootResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  }

  const url = new URL(`${SUPABASE_URL}/functions/v1/merkle-root`);
  url.searchParams.set('chainId', chainId.toString());
  url.searchParams.set('vaultAddress', vaultAddress);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to get Merkle root: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<HealthResponse> {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if API is configured
 */
export function isApiConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Commitment Info Response
 */
export interface CommitmentInfo {
  commitment: string;
  leafIndex: number;
  blockNumber: number;
  transactionHash: string;
  status: string;
  vaultId: string;
}

/**
 * Fetch commitment information (including leafIndex) from the API
 *
 * This endpoint allows fetching the leafIndex for a commitment that was
 * previously deposited. Useful for recovering notes that lost their leafIndex
 * due to page reloads or navigation before transaction confirmation.
 *
 * @param commitment The commitment hash (0x-prefixed, 32 bytes)
 * @param chainId Chain ID (defaults to NEXT_PUBLIC_CHAIN_ID)
 * @param vaultAddress Vault address (defaults to NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS)
 * @returns CommitmentInfo or null if not found
 */
export async function fetchCommitmentInfo(
  commitment: string,
  chainId?: number,
  vaultAddress?: string
): Promise<CommitmentInfo | null> {
  try {
    const CHAIN_ID = chainId || parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
    const VAULT_ADDRESS = vaultAddress || process.env.NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !VAULT_ADDRESS) {
      console.error('[ghostrouteApi] Missing environment variables:', {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY,
        hasVault: !!VAULT_ADDRESS,
      });
      throw new Error('Missing environment variables');
    }

    const url = new URL(`${SUPABASE_URL}/functions/v1/commitment-info`);
    url.searchParams.set('chainId', CHAIN_ID.toString());
    url.searchParams.set('vaultAddress', VAULT_ADDRESS.toLowerCase());
    url.searchParams.set('commitment', commitment.toLowerCase());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Commitment not found - transaction may not be confirmed yet
        console.log('[ghostrouteApi] Commitment not found or not confirmed:', commitment.slice(0, 20) + '...');
        return null;
      }
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Failed to fetch commitment info: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('[ghostrouteApi] ✅ Fetched commitment info:', {
      commitment: data.commitment.slice(0, 20) + '...',
      leafIndex: data.leafIndex,
    });

    return data;
  } catch (error) {
    console.error('[ghostrouteApi] ❌ Failed to fetch commitment info:', error);
    return null;
  }
}
