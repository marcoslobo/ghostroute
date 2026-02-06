export const PRIVACY_VAULT_ABI = [
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
