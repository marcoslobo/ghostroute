export interface Note {
  commitment: string;
  nullifier?: string;
  value: bigint;
  token: string;
  salt?: Uint8Array;
  createdAt?: Date;
}

export interface ExecuteActionParams {
  action: string;
  inputNotes: Note[];
  outputNotes: Note[];
  changeCommitment: string;
}

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
  gasPrice?: bigint;
}

export const ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
export const EXECUTE_ACTION_GAS_BASE = 200_000n;
export const GAS_BUFFER_PERCENT = 20;
