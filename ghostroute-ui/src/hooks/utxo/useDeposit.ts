/**
 * Hook for depositing ETH into Privacy Vault
 *
 * Flow:
 * 1. User enters amount
 * 2. Generate random nullifier and salt
 * 3. Compute commitment = poseidon3([value, token, salt])
 * 4. Call vault.deposit(commitment, nullifier) with ETH value
 * 5. Wait for confirmation
 * 6. Extract leafIndex from Deposit event
 * 7. Update note with leafIndex in localStorage
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import { DepositParams, DepositResult } from '@/types/utxo/deposit';
import { Note } from '@/types/utxo/note';
import { ETH_TOKEN_ADDRESS } from '@/config/tokens';
import { getPrivacyVaultAddress } from '@/config/privacy';
import { PRIVACY_VAULT_ABI } from '@/services/privacyVault';
import { computeCommitment, randomSalt } from '@/utils/utxo/commitment';
import { useNotes } from './useNotes';

export interface UseDepositReturn {
  deposit: (params: DepositParams) => Promise<DepositResult>;
  isPending: boolean;
  isConfirming: boolean;
  error: string | null;
}

/**
 * Convert Uint8Array to hex string with 0x prefix
 */
function bufferToHex(buffer: Uint8Array): `0x${string}` {
  return `0x${Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

export function useDeposit(): UseDepositReturn {
  const { address } = useAccount();
  const { addNote, updateNote } = useNotes();
  const vaultAddress = getPrivacyVaultAddress();

  const [depositError, setDepositError] = useState<string | null>(null);
  const [pendingNote, setPendingNote] = useState<Note | null>(null);
  const [pendingDeposit, setPendingDeposit] = useState<{
    note: Note;
    resolve: (result: DepositResult) => void;
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
        // Transaction submitted successfully - NOW save the note
        if (pendingDeposit) {
          const { note, resolve } = pendingDeposit;

          try {
            addNote(note);
            setPendingNote(note); // Store for leafIndex update
            console.log('[useDeposit] ✅ Note saved to localStorage after tx submission');

            resolve({
              success: true,
              note,
              transactionHash: txHash,
            });
          } catch (error) {
            console.error('[useDeposit] ❌ Failed to save note:', error);
            const message = error instanceof Error ? error.message : 'Failed to save note';
            resolve({
              success: false,
              error: message,
            });
          } finally {
            setPendingDeposit(null);
          }
        }
      },
      onError: (error) => {
        // Transaction submission failed
        if (pendingDeposit) {
          const { reject } = pendingDeposit;
          console.error('[useDeposit] ❌ Transaction failed:', error);
          reject(error as Error);
          setPendingDeposit(null);
        }
      },
    },
  });

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  // Extract leafIndex from transaction receipt when confirmed
  useEffect(() => {
    console.log('[useDeposit] useEffect triggered:', {
      isConfirmed,
      hasReceipt: !!receipt,
      hasPendingNote: !!pendingNote,
      hasVaultAddress: !!vaultAddress,
      pendingNoteCommitment: pendingNote?.commitment.slice(0, 20),
    });

    if (!isConfirmed || !receipt || !pendingNote || !vaultAddress) {
      console.log('[useDeposit] ⏭️  Skipping leafIndex extraction - conditions not met');
      return;
    }

    console.log('[useDeposit] 🔍 Searching for Deposit event in', receipt.logs.length, 'logs');

    try {
      // Find Deposit event in logs
      const depositLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: PRIVACY_VAULT_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'Deposit';
        } catch {
          return false;
        }
      });

      if (depositLog) {
        console.log('[useDeposit] ✅ Found Deposit event log');

        const decoded = decodeEventLog({
          abi: PRIVACY_VAULT_ABI,
          data: depositLog.data,
          topics: depositLog.topics,
        });

        console.log('[useDeposit] Decoded event:', decoded.eventName, decoded.args);

        if (decoded.eventName === 'Deposit') {
          const leafIndex = Number(decoded.args.leafIndex);

          console.log('[useDeposit] 🔄 Updating note with leafIndex:', leafIndex);
          console.log('[useDeposit] Note commitment:', pendingNote.commitment);

          // Update note with leafIndex
          updateNote(pendingNote.commitment, { leafIndex });

          console.log('[useDeposit] ✅ Captured leafIndex from Deposit event:', leafIndex);
        }
      } else {
        console.warn('[useDeposit] ⚠️  No Deposit event found in transaction logs');
        console.log('[useDeposit] All logs:', receipt.logs.map(l => ({
          address: l.address,
          topics: l.topics,
        })));
      }

      // Clear pending note
      setPendingNote(null);
    } catch (error) {
      console.error('[useDeposit] ❌ Failed to extract leafIndex from receipt:', error);
    }
  }, [isConfirmed, receipt, pendingNote, vaultAddress, updateNote]);

  const deposit = useCallback(
    ({ amount, token = ETH_TOKEN_ADDRESS }: DepositParams): Promise<DepositResult> => {
      return new Promise((resolve, reject) => {
        setDepositError(null);

        // Validate wallet connected
        if (!address) {
          resolve({ success: false, error: 'Wallet not connected' });
          return;
        }

        // Validate vault address configured
        if (!vaultAddress) {
          resolve({ success: false, error: 'Privacy Vault address not configured' });
          return;
        }

        // Validate amount
        if (amount <= 0n) {
          resolve({ success: false, error: 'Amount must be greater than 0' });
          return;
        }

        try {
          // Generate note
          const nullifier = randomSalt(); // 32 bytes
          const salt = randomSalt(); // 32 bytes
          const commitment = computeCommitment({
            value: amount,
            token,
            salt,
          });

          // Create note (without leafIndex - will be added when tx confirms)
          const note: Note = {
            commitment,
            nullifier: bufferToHex(nullifier),
            value: amount,
            token,
            salt,
            createdAt: new Date(),
            spent: false,
            // leafIndex will be added after tx confirmation via useEffect
          };

          // Store for onSuccess callback
          setPendingDeposit({ note, resolve, reject });

          // Call contract - note will be saved in onSuccess callback
          // Use depositERC20 for ERC20 tokens, deposit for ETH
          const isEth = token === ETH_TOKEN_ADDRESS;
          
          if (isEth) {
            writeContract({
              address: vaultAddress as `0x${string}`,
              abi: PRIVACY_VAULT_ABI,
              functionName: 'deposit',
              args: [commitment as `0x${string}`, bufferToHex(nullifier)],
              value: amount,
            });
          } else {
            writeContract({
              address: vaultAddress as `0x${string}`,
              abi: PRIVACY_VAULT_ABI,
              functionName: 'depositERC20',
              args: [
                token as `0x${string}`,
                amount,
                commitment as `0x${string}`,
                bufferToHex(nullifier),
              ],
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Deposit failed';
          setDepositError(message);
          resolve({ success: false, error: message });
        }
      });
    },
    [address, vaultAddress, writeContract]
  );

  const error = depositError || (writeError?.message || null);

  return {
    deposit,
    isPending: isWritePending,
    isConfirming,
    error,
  };
}
