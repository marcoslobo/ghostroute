import { Note } from './note';

export interface WithdrawParams {
  inputNote: Note;
  withdrawAmount: bigint;
  recipient: `0x${string}`;
}

export interface WithdrawResult {
  success: boolean;
  transactionHash?: string;
  changeNote?: Note;
  error?: string;
}

export interface WithdrawMathResult {
  withdrawAmount: bigint;
  changeNote: Note;
  changeCommitment: string;
  gasEstimate: bigint;
  totalInput: bigint;
}
