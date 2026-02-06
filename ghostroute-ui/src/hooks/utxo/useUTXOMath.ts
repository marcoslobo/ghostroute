'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Note } from '@/types/utxo/note';
import { UTXOMathResult, ExecuteActionParams, ExecuteActionResult } from '@/types/utxo';
import { calculateUTXO } from '@/utils/utxo/utxoMath';
import { computeChangeCommitment, randomSalt } from '@/utils/utxo/commitment';
import { getFallbackGasEstimate } from '@/utils/utxo/gasEstimator';
import { PRIVACY_VAULT_ABI } from '@/services/executeAction';
import { getPrivacyVaultAddress } from '@/config/privacy';

interface UseUTXOMathReturn {
  calculateUTXO: (inputNote: Note, investmentAmount: bigint) => UTXOMathResult;
  submitInvestment: (params: ExecuteActionParams) => Promise<ExecuteActionResult>;
  isPending: boolean;
  isConfirming: boolean;
  error: string | null;
}

export function useUTXOMath(): UseUTXOMathReturn {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const calculateUTXOCallback = useCallback((inputNote: Note, investmentAmount: bigint): UTXOMathResult => {
    setCalculationError(null);
    try {
      const fallbackGas = getFallbackGasEstimate();
      const result = calculateUTXO({
        inputNote,
        investmentAmount,
        gasEstimate: fallbackGas,
      });

      const commitment = computeChangeCommitment(
        result.changeNote.value,
        result.changeNote.token,
        result.changeNote.salt
      );

      return {
        ...result,
        changeCommitment: commitment,
        changeNote: {
          ...result.changeNote,
          commitment,
        },
        outputNotes: result.outputNotes.map((note, index) =>
          index === 1 ? { ...note, commitment } : note
        ),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Calculation failed';
      setCalculationError(message);
      throw err;
    }
  }, []);

  const submitInvestmentCallback = useCallback(
    async (params: ExecuteActionParams): Promise<ExecuteActionResult> => {
      setSubmitError(null);
      
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      const vaultAddress = getPrivacyVaultAddress();
      if (!vaultAddress) {
        return { success: false, error: 'Privacy Vault address not configured' };
      }

      try {
        writeContract({
          address: vaultAddress as `0x${string}`,
          abi: PRIVACY_VAULT_ABI,
          functionName: 'executeAction',
          args: [
            params.proof,
            params.root,
            params.nullifierHash,
            params.changeCommitment,
            params.actionHash,
            params.investAmount,
            params.uniswapParams,
          ],
        });

        return { success: true, transactionHash: hash };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setSubmitError(message);
        return { success: false, error: message };
      }
    },
    [address, writeContract, hash]
  );

  const error = calculationError || submitError || (writeError?.message || null);

  return {
    calculateUTXO: calculateUTXOCallback,
    submitInvestment: submitInvestmentCallback,
    isPending: isWritePending,
    isConfirming,
    error,
  };
}
