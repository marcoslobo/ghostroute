import { Note } from '@/types/utxo/note';
import { UTXOMathResult, InvestmentParams } from '@/types/utxo';
import { randomSalt } from './commitment';
import { ETH_TOKEN_ADDRESS } from '@/config/tokens';
import { EXECUTE_ACTION_GAS_BASE, calculateGasWithBuffer } from '@/config/gas';

export function calculateUTXO(params: InvestmentParams): UTXOMathResult {
  const { inputNote, investmentAmount, gasEstimate: providedGasEstimate } = params;

  const gasEstimate = providedGasEstimate ?? calculateGasWithBuffer(EXECUTE_ACTION_GAS_BASE);

  validateSufficientFunds(inputNote, investmentAmount, gasEstimate);

  const totalInput = inputNote.value;
  const changeValue = totalInput - investmentAmount - gasEstimate;

  const changeNote: Note = {
    commitment: '',
    value: changeValue,
    token: inputNote.token,
    salt: randomSalt(),
    createdAt: new Date(),
  };

  const investmentNote: Note = {
    commitment: '',
    value: investmentAmount,
    token: ETH_TOKEN_ADDRESS,
    createdAt: new Date(),
  };

  const totalOutput = changeValue + investmentAmount;

  return {
    inputNotes: [inputNote],
    outputNotes: [investmentNote, changeNote],
    changeNote,
    changeCommitment: '',
    gasEstimate,
    investmentAmount,
    totalInput,
    totalOutput,
  };
}

export function validateSufficientFunds(
  inputNote: Note,
  investmentAmount: bigint,
  gasEstimate: bigint
): void {
  const required = investmentAmount + gasEstimate;
  if (inputNote.value < required) {
    throw new Error(
      `Insufficient funds: have ${formatETH(inputNote.value)}, need ${formatETH(required)}`
    );
  }
}

export function validateBalanceConservation(result: UTXOMathResult): void {
  const expectedOutput = result.investmentAmount + result.gasEstimate + result.changeNote.value;
  if (result.totalOutput !== expectedOutput) {
    throw new Error('Balance conservation violated');
  }
}

function formatETH(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  return `${eth.toFixed(6)} ETH`;
}
