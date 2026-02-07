import { Note } from './note';
import { EnrichedPool } from '@/components/UniswapPoolsSection';

/**
 * Parameters required to execute a privacy-preserving pool investment
 */
export interface PoolInvestmentParams {
  inputNote: Note;
  pool: EnrichedPool;
  investAmount: bigint;
  tickLower: number;
  tickUpper: number;
  recipient?: `0x${string}`;
}

/**
 * Result returned after investment calculation/preview
 */
export interface InvestmentPreview {
  investAmount: bigint;
  gasEstimate: bigint;
  changeNote: Note;
  changeCommitment: `0x${string}`;
  actionHash: `0x${string}`;
  isValid: boolean;
  error?: string;
}

/**
 * Result returned after investment execution
 */
export interface PoolInvestmentResult {
  success: boolean;
  transactionHash?: `0x${string}`;
  changeNote?: Note;
  error?: string;
}

/**
 * Return type for usePoolInvestment hook
 */
export interface UsePoolInvestmentReturn {
  invest: (params: PoolInvestmentParams) => Promise<PoolInvestmentResult>;
  calculateInvestment: (
    note: Note,
    pool: EnrichedPool,
    amount: bigint,
    tickLower: number,
    tickUpper: number
  ) => InvestmentPreview;
  isCompatiblePool: (pool: EnrichedPool, note: Note) => boolean;
  isPending: boolean;
  isConfirming: boolean;
  isGeneratingProof: boolean;
  error: string | null;
}
