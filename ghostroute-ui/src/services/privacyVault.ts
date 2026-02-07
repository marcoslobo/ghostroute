/**
 * Complete PrivacyVault ABI with deposit, withdraw, executeAction functions
 *
 * Contract deployed on Sepolia: 0x3e078e8af9aBaf8156Beca429A1d35B9398a2208
 * Verifier: 0x2F669A07A17E664D2168b9CD5e8EF6AB5dcFe70d (placeholder, always returns true)
 */

export const PRIVACY_VAULT_ABI = [
  // Simplified deposit for testing (ETH only)
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'commitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'nullifier', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [
      { name: 'leafIndex', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'payable',
  },

  // Withdraw ETH to recipient
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'proof', type: 'bytes', internalType: 'bytes' },
      { name: 'root', type: 'bytes32', internalType: 'bytes32' },
      { name: 'nullifierHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'changeCommitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'recipient', type: 'address', internalType: 'address payable' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Execute DeFi action (e.g., Uniswap swap)
  {
    type: 'function',
    name: 'executeAction',
    inputs: [
      { name: 'proof', type: 'bytes', internalType: 'bytes' },
      { name: 'root', type: 'bytes32', internalType: 'bytes32' },
      { name: 'nullifierHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'changeCommitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'actionHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'investAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'uniswapParams', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Get current Merkle root
  {
    type: 'function',
    name: 'currentRoot',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' },
    ],
    stateMutability: 'view',
  },

  // Get Merkle root (alias)
  {
    type: 'function',
    name: 'getMerkleRoot',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' },
    ],
    stateMutability: 'view',
  },

  // Compute action hash for Uniswap
  {
    type: 'function',
    name: 'computeActionHash',
    inputs: [
      { name: 'poolId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'tickLower', type: 'int24', internalType: 'int24' },
      { name: 'tickUpper', type: 'int24', internalType: 'int24' },
      { name: 'amount0', type: 'uint256', internalType: 'uint256' },
      { name: 'amount1', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' },
    ],
    stateMutability: 'pure',
  },

  // Check if nullifier has been used
  {
    type: 'function',
    name: 'isNullifierUsed',
    inputs: [
      { name: 'nullifier', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },

  // Check if commitment exists
  {
    type: 'function',
    name: 'commitments',
    inputs: [
      { name: 'commitment', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },

  // Events
  {
    type: 'event',
    name: 'Deposit',
    inputs: [
      { name: 'commitment', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'nullifier', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'leafIndex', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newRoot', type: 'bytes32', indexed: false, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
] as const;
