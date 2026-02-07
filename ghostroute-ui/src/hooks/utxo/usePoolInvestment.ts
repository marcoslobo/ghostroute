'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { keccak256, toBytes, formatUnits } from 'viem';
import { PRIVACY_VAULT_ABI } from '@/services/privacyVault';
import { Note } from '@/types/utxo/note';
import { EnrichedPool } from '@/components/UniswapPoolsSection';
import { PoolInvestmentParams, InvestmentPreview, PoolInvestmentResult } from '@/types/utxo/investment';
import { isPoolCompatible } from '@/utils/utxo/poolCompatibility';
import { computeActionHash } from '@/utils/utxo/actionHash';
import { computeChangeCommitment, randomSalt } from '@/utils/utxo/commitment';
import { useNotes } from './useNotes';
import { EXECUTE_ACTION_GAS_BASE } from '@/config/gas';
import { getTokenDecimals, getTokenSymbol, ETH_TOKEN_ADDRESS } from '@/config/tokens';

const PLACEHOLDER_PROOF = '0x00' as `0x${string}`;
const EXECUTE_ACTION_GAS_LIMIT = 300000n;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

interface UniswapParams {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  tickLower: number;
  tickUpper: number;
  liquidityDelta: bigint;
  salt: string;
}

function encodeUniswapParams(
  pool: EnrichedPool,
  note: Note,
  amount: bigint,
  tickLower: number,
  tickUpper: number
): `0x${string}` {
  const investmentSide = getInvestmentSide(pool, note);
  const liquidityDelta = investmentSide === 0 ? amount : amount;

  const saltBytes = new Uint8Array(32);
  crypto.getRandomValues(saltBytes);
  const salt = '0x' + Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const params: UniswapParams = {
    token0: pool.token0.id,
    token1: pool.token1.id,
    fee: pool.fee,
    tickSpacing: pool.tickSpacing,
    tickLower,
    tickUpper,
    liquidityDelta,
    salt,
  };

  const encoded = 
    params.token0.slice(2).padStart(40, '0') +
    params.token1.slice(2).padStart(40, '0') +
    params.fee.toString(16).padStart(8, '0') +
    params.tickSpacing.toString(16).padStart(8, '0') +
    (params.tickLower >>> 0).toString(16).padStart(8, '0') +
    (params.tickUpper >>> 0).toString(16).padStart(8, '0') +
    params.liquidityDelta.toString(16).padStart(32, '0') +
    params.salt.slice(2);

  return `0x${encoded}` as `0x${string}`;
}

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

export function usePoolInvestment(): UsePoolInvestmentReturn {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { addNote, markAsSpent } = useNotes();

  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  /**
   * Calculate investment preview including change note and actionHash
   */
  const calculateInvestment = useCallback(
    (
      note: Note,
      pool: EnrichedPool,
      amount: bigint,
      tickLower: number,
      tickUpper: number
    ): InvestmentPreview => {
      console.log('[usePoolInvestment] Calculating investment preview...');

      try {
        // Validate inputs
        if (amount <= 0n) {
          return {
            investAmount: amount,
            gasEstimate: EXECUTE_ACTION_GAS_BASE,
            changeNote: {} as Note,
            changeCommitment: '0x0' as `0x${string}`,
            actionHash: '0x0' as `0x${string}`,
            isValid: false,
            error: 'Investment amount must be greater than 0',
          };
        }

        if (amount > note.value) {
          return {
            investAmount: amount,
            gasEstimate: EXECUTE_ACTION_GAS_BASE,
            changeNote: {} as Note,
            changeCommitment: '0x0' as `0x${string}`,
            actionHash: '0x0' as `0x${string}`,
            isValid: false,
            error: 'Insufficient funds in note',
          };
        }

        // Calculate change
        // IMPORTANT: Gas is paid in ETH by the wallet, NOT subtracted from the token note
        // Only for ETH notes we need to consider gas in the calculation
        const gasEstimate = EXECUTE_ACTION_GAS_BASE;
        const isEthNote = note.token === ETH_TOKEN_ADDRESS;
        
        if (amount > note.value) {
          return {
            investAmount: amount,
            gasEstimate,
            changeNote: {} as Note,
            changeCommitment: '0x0' as `0x${string}`,
            actionHash: '0x0' as `0x${string}`,
            isValid: false,
            error: `Insufficient funds: want ${formatUnits(amount, getTokenDecimals(note.token, pool.chainId))} ${getTokenSymbol(note.token, pool.chainId)}, have ${formatUnits(note.value, getTokenDecimals(note.token, pool.chainId))}`,
          };
        }

        // For ETH notes: subtract gas from change (gas paid in ETH)
        // For ERC20 notes: gas is paid separately in ETH, only subtract investment amount
        const changeValue = isEthNote ? note.value - amount - gasEstimate : note.value - amount;
        
        if (changeValue < 0n) {
          return {
            investAmount: amount,
            gasEstimate,
            changeNote: {} as Note,
            changeCommitment: '0x0' as `0x${string}`,
            actionHash: '0x0' as `0x${string}`,
            isValid: false,
            error: isEthNote 
              ? `Insufficient funds: need ${formatUnits(amount + gasEstimate, 18)} ETH (including gas), have ${formatUnits(note.value, 18)} ETH`
              : `Insufficient funds: want ${formatUnits(amount, getTokenDecimals(note.token, pool.chainId))} ${getTokenSymbol(note.token, pool.chainId)}, have ${formatUnits(note.value, getTokenDecimals(note.token, pool.chainId))}`,
          };
        }

        // Create change note
        const changeSalt = randomSalt();
        const changeNote: Note = {
          commitment: '',
          value: changeValue,
          token: note.token,
          salt: changeSalt,
          createdAt: new Date(),
        };

        // Compute change commitment
        const changeCommitment = computeChangeCommitment(changeValue, note.token, changeSalt) as `0x${string}`;

        // Compute actionHash
        // For single-sided liquidity, one amount is the investAmount and the other is 0
        const investmentSide = getInvestmentSide(pool, note);
        const amount0Desired = investmentSide === 0 ? amount : 0n;
        const amount1Desired = investmentSide === 1 ? amount : 0n;

        const actionHash = computeActionHash(
          pool.fullPoolId,
          tickLower,
          tickUpper,
          amount0Desired,
          amount1Desired
        );

        console.log('[usePoolInvestment] ✅ Preview calculated:', {
          investAmount: formatUnits(amount, getTokenDecimals(note.token, pool.chainId)),
          changeAmount: formatUnits(changeValue, getTokenDecimals(note.token, pool.chainId)),
          gasEstimate: formatUnits(gasEstimate, 18),
          actionHash: actionHash.slice(0, 10) + '...',
        });

        return {
          investAmount: amount,
          gasEstimate,
          changeNote,
          changeCommitment,
          actionHash,
          isValid: true,
        };
      } catch (err) {
        console.error('[usePoolInvestment] ❌ Error calculating investment:', err);
        return {
          investAmount: amount,
          gasEstimate: EXECUTE_ACTION_GAS_BASE,
          changeNote: {} as Note,
          changeCommitment: '0x0' as `0x${string}`,
          actionHash: '0x0' as `0x${string}`,
          isValid: false,
          error: err instanceof Error ? err.message : 'Unknown error calculating investment',
        };
      }
    },
    []
  );

  /**
   * Check if a pool is compatible with a note
   */
  const isCompatiblePoolFn = useCallback((pool: EnrichedPool, note: Note): boolean => {
    return isPoolCompatible(pool, note);
  }, []);

  /**
   * Fetch Merkle root with retry logic
   */
  const fetchMerkleRootWithRetry = async (vaultAddress: string): Promise<`0x${string}`> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`[usePoolInvestment] Fetching Merkle root (attempt ${attempt}/${RETRY_ATTEMPTS})...`);

        const root = await publicClient?.readContract({
          address: vaultAddress as `0x${string}`,
          abi: PRIVACY_VAULT_ABI,
          functionName: 'currentRoot',
        });

        if (root) {
          console.log('[usePoolInvestment] ✅ Merkle root fetched:', (root as string).slice(0, 10) + '...');
          return root as `0x${string}`;
        }

        throw new Error('Merkle root is undefined');
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error fetching Merkle root');
        console.warn(`[usePoolInvestment] ⚠️ Attempt ${attempt} failed:`, lastError.message);

        if (attempt < RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError || new Error('Failed to fetch Merkle root after all retries');
  };

  /**
   * Execute the investment transaction
   */
  const invest = useCallback(
    async (params: PoolInvestmentParams): Promise<PoolInvestmentResult> => {
      const { inputNote, pool, investAmount, tickLower, tickUpper } = params;

      console.log('[usePoolInvestment] Starting investment...');
      setIsPending(true);
      setIsConfirming(false);
      setIsGeneratingProof(true);
      setError(null);

      try {
        // Validate wallet connection
        if (!address || !chainId) {
          throw new Error('Wallet not connected. Please connect your wallet to invest.');
        }

        // Validate note has leafIndex
        if (inputNote.leafIndex === undefined) {
          throw new Error('Invalid note: missing leafIndex. Please wait for deposit confirmation.');
        }

        // Validate note is not spent
        if (inputNote.spent) {
          throw new Error('Note has already been spent.');
        }

        // Get vault address from environment
        const vaultAddress = process.env.NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS;
        if (!vaultAddress) {
          throw new Error('PrivacyVault address not configured. Please check environment variables.');
        }

        // Calculate preview
        const preview = calculateInvestment(inputNote, pool, investAmount, tickLower, tickUpper);

        if (!preview.isValid) {
          throw new Error(preview.error || 'Invalid investment parameters');
        }

        console.log('[usePoolInvestment] Investment preview:', {
          investAmount: formatUnits(investAmount, getTokenDecimals(inputNote.token, pool.chainId)),
          token: getTokenSymbol(inputNote.token, pool.chainId),
          pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
        });

        // Generate placeholder proof (MVP - works with MockZKVerifier)
        console.log('[usePoolInvestment] Generating proof (placeholder for MVP)...');
        const proof = PLACEHOLDER_PROOF;

        // Compute nullifierHash
        if (!inputNote.nullifier) {
          throw new Error('Invalid note: missing nullifier');
        }
        const nullifierHash = keccak256(toBytes(inputNote.nullifier));
        console.log('[usePoolInvestment] Nullifier hash computed:', nullifierHash.slice(0, 10) + '...');

        // Fetch Merkle root
        setIsGeneratingProof(false);
        const root = await fetchMerkleRootWithRetry(vaultAddress);

        // Prepare transaction
        console.log('[usePoolInvestment] Submitting transaction...');
        setIsConfirming(true);

        // Encode uniswap params
        const uniswapParams = encodeUniswapParams(pool, inputNote, investAmount, tickLower, tickUpper);

        // Call executeAction
        const txHash = await writeContractAsync({
          address: vaultAddress as `0x${string}`,
          abi: PRIVACY_VAULT_ABI,
          functionName: 'executeAction',
          args: [
            proof,
            root,
            nullifierHash,
            preview.changeCommitment,
            preview.actionHash,
            investAmount,
            uniswapParams,
          ],
          gas: EXECUTE_ACTION_GAS_LIMIT,
        });

        console.log('[usePoolInvestment] ✅ Transaction submitted:', txHash);

        // Mark input note as spent
        markAsSpent(inputNote.commitment, txHash);

        // Save change note
        const changeNoteWithCommitment: Note = {
          ...preview.changeNote,
          commitment: preview.changeCommitment,
        };
        addNote(changeNoteWithCommitment);

        console.log('[usePoolInvestment] ✅ Investment complete! Change note saved:', {
          commitment: preview.changeCommitment.slice(0, 10) + '...',
          value: formatUnits(preview.changeNote.value, getTokenDecimals(inputNote.token, pool.chainId)),
        });

        setIsPending(false);
        setIsConfirming(false);

        return {
          success: true,
          transactionHash: txHash,
          changeNote: changeNoteWithCommitment,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during investment';
        console.error('[usePoolInvestment] ❌ Investment failed:', errorMessage);
        setError(errorMessage);
        setIsPending(false);
        setIsConfirming(false);
        setIsGeneratingProof(false);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [address, chainId, publicClient, writeContractAsync, addNote, markAsSpent, calculateInvestment]
  );

  return {
    invest,
    calculateInvestment,
    isCompatiblePool: isCompatiblePoolFn,
    isPending,
    isConfirming,
    isGeneratingProof,
    error,
  };
}

/**
 * Helper to get investment side (duplicated from poolCompatibility to avoid circular import)
 */
function getInvestmentSide(pool: EnrichedPool, note: Note): 0 | 1 | -1 {
  const noteToken = note.token.toLowerCase();
  const isETH = noteToken === '0x0000000000000000000000000000000000000000';
  const wethAddresses: Record<number, string> = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    11155111: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  };
  const weth = wethAddresses[pool.chainId]?.toLowerCase();

  const poolToken0 = pool.token0.id.toLowerCase();
  const poolToken1 = pool.token1.id.toLowerCase();

  if (isETH && weth) {
    if (poolToken0 === weth) return 0;
    if (poolToken1 === weth) return 1;
    return -1;
  }

  if (poolToken0 === noteToken) return 0;
  if (poolToken1 === noteToken) return 1;
  return -1;
}
