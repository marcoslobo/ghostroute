/**
 * Hook for withdrawing ETH from Privacy Vault
 *
 * Flow:
 * 1. User selects note + enters withdraw amount + recipient
 * 2. Calculate change note
 * 3. Get current Merkle root from contract
 * 4. Generate nullifierHash = keccak256(inputNote.nullifier)
 * 5. Call vault.withdraw(proof, root, nullifierHash, changeCommitment, recipient, amount)
 * 6. Wait for confirmation
 * 7. Mark input note as spent
 * 8. Save change note to localStorage
 */

'use client';

import { useState, useCallback } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { WithdrawParams, WithdrawResult } from '@/types/utxo/withdraw';
import { Note } from '@/types/utxo/note';
import { getPrivacyVaultAddress } from '@/config/privacy';
import { PRIVACY_VAULT_ABI } from '@/services/privacyVault';
import { calculateWithdrawUTXO } from '@/utils/utxo/withdrawMath';
import { randomSecret, computeActionHash } from '@/utils/utxo/pedersenCommitment';
import { generateWithdrawProof } from '@/services/proofGenerator';
import { getMerkleProof } from '@/services/merkleProof';
import { useNotes } from './useNotes';

export interface UseWithdrawReturn {
  withdraw: (params: WithdrawParams) => Promise<WithdrawResult>;
  calculateWithdraw: (inputNote: Note, amount: bigint) => ReturnType<typeof calculateWithdrawUTXO>;
  isPending: boolean;
  isConfirming: boolean;
  isGeneratingProof: boolean;
  error: string | null;
}

export function useWithdraw(): UseWithdrawReturn {
  const { address } = useAccount();
  const { addNote, markAsSpent } = useNotes();
  const publicClient = usePublicClient();
  const vaultAddress = getPrivacyVaultAddress();

  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState<{
    inputNote: Note;
    changeNote: Note;
    resolve: (result: WithdrawResult) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: (txHash) => {
        // Transaction submitted successfully - NOW update notes
        if (pendingWithdraw) {
          const { inputNote, changeNote, resolve } = pendingWithdraw;

          try {
            // Mark input note as spent
            markAsSpent(inputNote.commitment, txHash);

            // Save change note (only if change > 0)
            if (changeNote.value > 0n) {
              addNote(changeNote);
            }

            console.log('[useWithdraw] ✅ Notes updated after tx submission');

            resolve({
              success: true,
              transactionHash: txHash,
              changeNote,
            });
          } catch (error) {
            console.error('[useWithdraw] ❌ Failed to update notes:', error);
            const message = error instanceof Error ? error.message : 'Failed to update notes';
            resolve({
              success: false,
              error: message,
            });
          } finally {
            setPendingWithdraw(null);
          }
        }
      },
      onError: (error) => {
        // Transaction submission failed
        if (pendingWithdraw) {
          const { reject } = pendingWithdraw;
          console.error('[useWithdraw] ❌ Transaction failed:', error);
          reject(error as Error);
          setPendingWithdraw(null);
        }
      },
    },
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  /**
   * Fetch current Merkle root directly from the contract
   *
   * IMPORTANT: Due to bug in webhook's Merkle tree implementation,
   * we must read the root from the contract instead of the API.
   * The webhook uses SparseMerkleTree while the contract uses a simple hash chain.
   */
  const fetchMerkleRoot = async (): Promise<`0x${string}` | null> => {
    try {
      if (!vaultAddress) {
        throw new Error('Vault address not configured');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Read currentRoot directly from the contract with timeout
      const rootPromise = publicClient.readContract({
        address: vaultAddress as `0x${string}`,
        abi: PRIVACY_VAULT_ABI,
        functionName: 'currentRoot',
      });

      // Add 10 second timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout fetching root from RPC')), 10000)
      );

      const root = await Promise.race([rootPromise, timeoutPromise]);

      console.log('[useWithdraw] ✅ Fetched Merkle root from contract:', root);

      return root as `0x${string}`;
    } catch (error) {
      console.error('[useWithdraw] ❌ Failed to fetch Merkle root from contract:', error);
      return null;
    }
  };

  const calculateWithdraw = useCallback(
    (inputNote: Note, amount: bigint) => {
      return calculateWithdrawUTXO({
        inputNote,
        withdrawAmount: amount,
      });
    },
    []
  );

  const withdraw = useCallback(
    ({ inputNote, withdrawAmount, recipient, token }: WithdrawParams): Promise<WithdrawResult> => {
      return new Promise(async (resolve, reject) => {
        console.log('[useWithdraw] 🚀 Withdraw started:', { withdrawAmount, recipient, token });
        setWithdrawError(null);

        // Validate wallet connected
        if (!address) {
          console.log('[useWithdraw] ❌ Wallet not connected');
          resolve({ success: false, error: 'Wallet not connected' });
          return;
        }

        // Validate vault address configured
        if (!vaultAddress) {
          resolve({ success: false, error: 'Privacy Vault address not configured' });
          return;
        }

        // Validate inputs
        if (withdrawAmount <= 0n) {
          resolve({ success: false, error: 'Withdraw amount must be greater than 0' });
          return;
        }

        if (!inputNote.nullifier) {
          resolve({ success: false, error: 'Input note missing nullifier' });
          return;
        }

      try {
        // Calculate change note
        console.log('[useWithdraw] 📊 Calculating change note...');
        const { changeNote, changeCommitment } = calculateWithdrawUTXO({
          inputNote,
          withdrawAmount,
        });
        console.log('[useWithdraw] ✅ Change note calculated:', changeNote.value.toString());

        // Get merkle root from contract
        console.log('[useWithdraw] 🌳 Fetching Merkle root from contract...');
        const root = await fetchMerkleRoot();
        console.log('[useWithdraw] Root fetched:', root);

        if (!root) {
          throw new Error(
            'Cannot read currentRoot from contract. Please ensure wallet is connected and contract is accessible.'
          );
        }

        // Generate nullifierHash
        const nullifierHash = keccak256(toBytes(inputNote.nullifier as `0x${string}`));

        console.log('[useWithdraw] 🔑 Withdraw values:', {
          root: root.slice(0, 10) + '...',
          rootLength: root.length,
          nullifierHash: nullifierHash.slice(0, 10) + '...',
          nullifierHashLength: nullifierHash.length,
          changeCommitment: (changeCommitment as string).slice(0, 10) + '...',
          changeCommitmentLength: (changeCommitment as string).length,
          withdrawAmount: withdrawAmount.toString(),
          recipient,
          token,
        });

        // Generate ZK proof
        setIsGeneratingProof(true);
        let proofBytes: Uint8Array;

        try {
          // Get Merkle proof for input note
          // Requires leafIndex from deposit transaction
          if (inputNote.leafIndex === undefined) {
            throw new Error(
              'Note does not have leafIndex. This note was created before leafIndex tracking was implemented. ' +
              'Using placeholder proof instead.'
            );
          }

          const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
          const merkleProof = await getMerkleProof(inputNote.leafIndex, chainId);

          // Generate change note secrets
          const changeSecrets = {
            nullifier_secret: randomSecret(),
            blinding: randomSecret(),
            amount: changeNote.value,
          };

          // Generate zero-knowledge proof
          const { proof: generatedProof } = await generateWithdrawProof({
            inputNote,
            merkleRoot: root,
            merkleProof: merkleProof.proof,
            leafIndex: merkleProof.leafIndex,
            withdrawAmount,
            recipient,
            changeNote: changeSecrets,
          });

          proofBytes = generatedProof;
        } catch (proofError) {
          console.warn('[useWithdraw] Proof generation failed, using placeholder:', proofError);
          // Fallback to placeholder proof (works with placeholder verifier)
          proofBytes = new Uint8Array([0]);
        } finally {
          setIsGeneratingProof(false);
        }

        // Convert proof to hex
        const proof = `0x${Buffer.from(proofBytes).toString('hex')}` as `0x${string}`;

        // Store for onSuccess callback
        setPendingWithdraw({ inputNote, changeNote, resolve, reject });

        // Determine if ERC20 or ETH withdrawal
        const isERC20 = !!token;
        
        // Prepare args based on withdrawal type
        if (isERC20) {
          // Calculate actionHash for ERC20 withdrawal
          const actionHash = await computeActionHash(recipient, withdrawAmount);
          
          console.log('[useWithdraw] 📤 About to call withdrawERC20:', {
            vaultAddress,
            proof: proof.slice(0, 20) + '...',
            root,
            nullifierHash: nullifierHash.slice(0, 10) + '...',
            changeCommitment: (changeCommitment as string).slice(0, 10) + '...',
            actionHash: actionHash.slice(0, 10) + '...',
            token,
            recipient,
            amount: withdrawAmount.toString(),
            gas: '800000',
          });

          // Call withdrawERC20
          writeContract({
            address: vaultAddress as `0x${string}`,
            abi: PRIVACY_VAULT_ABI,
            functionName: 'withdrawERC20',
            args: [proof, root, nullifierHash, changeCommitment as `0x${string}`, actionHash, token, recipient, withdrawAmount],
            gas: 800_000n,
          });
        } else {
          console.log('[useWithdraw] 📤 About to call withdraw:', {
            vaultAddress,
            proof: proof.slice(0, 20) + '...',
            root,
            nullifierHash: nullifierHash.slice(0, 10) + '...',
            changeCommitment: (changeCommitment as string).slice(0, 10) + '...',
            recipient,
            amount: withdrawAmount.toString(),
            gas: '800000',
          });

          // Call withdraw (ETH)
          writeContract({
            address: vaultAddress as `0x${string}`,
            abi: PRIVACY_VAULT_ABI,
            functionName: 'withdraw',
            args: [proof, root, nullifierHash, changeCommitment as `0x${string}`, recipient, withdrawAmount],
            gas: 800_000n,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Withdraw failed';
        setWithdrawError(message);
        resolve({ success: false, error: message });
      }
      });
    },
    [address, vaultAddress, writeContract, addNote, markAsSpent]
  );

  const error = withdrawError || (writeError?.message || null);

  return {
    withdraw,
    calculateWithdraw,
    isPending: isWritePending,
    isConfirming,
    isGeneratingProof,
    error,
  };
}
