import { Note } from './note';

export interface DepositParams {
  amount: bigint;
  token?: string; // defaults to ETH (0x0000...)
}

export interface DepositResult {
  success: boolean;
  note?: Note;
  leafIndex?: number;
  transactionHash?: string;
  error?: string;
}
