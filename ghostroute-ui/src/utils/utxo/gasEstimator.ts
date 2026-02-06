import { PublicClient } from 'viem';
import { EXECUTE_ACTION_GAS_BASE, calculateGasWithBuffer } from '@/config/gas';

export interface GasEstimationParams {
  vaultAddress: string;
  proof: `0x${string}`;
  root: `0x${string}`;
  nullifierHash: `0x${string}`;
  changeCommitment: `0x${string}`;
  actionHash: `0x${string}`;
  investAmount: bigint;
  uniswapParams: `0x${string}`;
}

const PRIVACY_VAULT_ABI = [
  {
    inputs: [
      { name: 'proof', type: 'bytes' },
      { name: 'root', type: 'bytes32' },
      { name: 'nullifierHash', type: 'bytes32' },
      { name: 'changeCommitment', type: 'bytes32' },
      { name: 'actionHash', type: 'bytes32' },
      { name: 'investAmount', type: 'uint256' },
      { name: 'uniswapParams', type: 'bytes' },
    ],
    name: 'executeAction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function estimateExecuteActionGas(
  publicClient: PublicClient,
  params: GasEstimationParams
): Promise<bigint> {
  try {
    const estimated = await publicClient.estimateContractGas({
      address: params.vaultAddress as `0x${string}`,
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

    return (estimated * 120n) / 100n;
  } catch (error) {
    console.warn('Gas estimation failed, using historical data:', error);
    return calculateGasWithBuffer(EXECUTE_ACTION_GAS_BASE);
  }
}

export function getFallbackGasEstimate(): bigint {
  return calculateGasWithBuffer(EXECUTE_ACTION_GAS_BASE);
}
