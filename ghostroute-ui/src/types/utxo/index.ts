import { Note } from './note';

export interface UTXOMathResult {
  inputNotes: Note[];
  outputNotes: Note[];
  changeNote: Note;
  changeCommitment: string;
  gasEstimate: bigint;
  investmentAmount: bigint;
  totalInput: bigint;
  totalOutput: bigint;
}

export interface GasEstimate {
  base: bigint;
  withBuffer: bigint;
  unit: 'wei' | 'gwei' | 'ether';
}

export interface InvestmentParams {
  inputNote: Note;
  investmentAmount: bigint;
  gasEstimate?: bigint;
  vaultAddress?: string;
}

export interface ExecuteActionParams {
  action: string;
  inputNotes: Note[];
  outputNotes: Note[];
  changeCommitment: string;
  proof: `0x${string}`;
  root: `0x${string}`;
  nullifierHash: `0x${string}`;
  actionHash: `0x${string}`;
  investAmount: bigint;
  uniswapParams: `0x${string}`;
}

export interface ExecuteActionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}
