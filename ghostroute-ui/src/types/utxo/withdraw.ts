import { Note } from './note';

export interface WithdrawParams {
  inputNote: Note;
  withdrawAmount: bigint;
  recipient: `0x${string}`;
  token?: `0x${string}`; // Optional: for ERC20 withdrawals
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
