/**
 * Withdraw UTXO math calculations
 *
 * Calculates change note when withdrawing partial amount from a note
 */

import { Note } from '@/types/utxo/note';
import { WithdrawMathResult } from '@/types/utxo/withdraw';
import { WITHDRAW_GAS_BASE, GAS_BUFFER_PERCENT } from '@/config/gas';
import { computeCommitment, randomSalt } from './commitment';

/**
 * Calculate gas with buffer
 */
function calculateGasWithBuffer(baseGas: bigint): bigint {
  const buffer = (baseGas * BigInt(GAS_BUFFER_PERCENT)) / 100n;
  return baseGas + buffer;
}

/**
 * Calculate withdraw change note
 *
 * IMPORTANT: Gas is paid by the transaction sender's wallet, NOT deducted from the note!
 *
 * UTXO Balance Equation: inputNote.value = withdrawAmount + changeNote.value
 *
 * Example:
 * - Input note: 10 ETH
 * - Withdraw amount: 3 ETH
 * - Change: 10 - 3 = 7 ETH
 * - Gas: ~0.0004 ETH (paid by your wallet separately)
 */
export function calculateWithdrawUTXO(params: {
  inputNote: Note;
  withdrawAmount: bigint;
  gasEstimate?: bigint;
}): WithdrawMathResult {
  const { inputNote, withdrawAmount, gasEstimate: providedGas } = params;

  // Calculate gas estimate for display purposes only (not deducted from note)
  const gasEstimate = providedGas ?? calculateGasWithBuffer(WITHDRAW_GAS_BASE);

  // Calculate change amount (gas is NOT deducted from note!)
  const changeValue = inputNote.value - withdrawAmount;

  // Validate sufficient funds in the note
  if (changeValue < 0n) {
    throw new Error(
      `Insufficient funds in note. Trying to withdraw ${withdrawAmount} but note only has ${inputNote.value}`
    );
  }

  // Generate new change note
  const changeSalt = randomSalt();
  const changeNote: Note = {
    commitment: '', // computed below
    value: changeValue,
    token: inputNote.token,
    salt: changeSalt,
    createdAt: new Date(),
    spent: false,
  };

  // Compute commitment for change note
  const changeCommitment = computeCommitment(changeNote);

  return {
    withdrawAmount,
    changeNote: {
      ...changeNote,
      commitment: changeCommitment,
    },
    changeCommitment,
    gasEstimate,
    totalInput: inputNote.value,
  };
}
