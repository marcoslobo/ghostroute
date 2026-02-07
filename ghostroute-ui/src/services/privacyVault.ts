/**
 * Complete PrivacyVault ABI with deposit, withdraw, executeAction functions
 *
 * Contract deployed on Sepolia
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

  // Deposit with Permit2 (supports ERC20 tokens)
  {
    type: 'function',
    name: 'depositWithPermit',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'commitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'nullifier', type: 'bytes32', internalType: 'bytes32' },
      { name: 'permit', type: 'tuple', internalType: 'tuple' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [
      { name: 'leafIndex', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'payable',
  },

  // Deposit ERC20 tokens (uses transferFrom, requires prior approval)
  {
    type: 'function',
    name: 'depositERC20',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'commitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'nullifier', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [
      { name: 'leafIndex', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
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

  // Withdraw ERC20 tokens using a ZK proof
  {
    type: 'function',
    name: 'withdrawERC20',
    inputs: [
      { name: 'proof', type: 'bytes', internalType: 'bytes' },
      { name: 'root', type: 'bytes32', internalType: 'bytes32' },
      { name: 'nullifierHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'changeCommitment', type: 'bytes32', internalType: 'bytes32' },
      { name: 'actionHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'recipient', type: 'address', internalType: 'address' },
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

  // Check if token is allowed
  {
    type: 'function',
    name: 'isTokenAllowed',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },

  // Get token balance in vault
  {
    type: 'function',
    name: 'getTokenBalance',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
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

  // Anonymous ETH Withdrawal
  {
    type: 'event',
    name: 'AnonymousWithdrawal',
    inputs: [
      { name: 'nullifier', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'changeCommitment', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'changeIndex', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },

  // Anonymous ERC20 Withdrawal
  {
    type: 'event',
    name: 'AnonymousERC20Withdrawal',
    inputs: [
      { name: 'nullifier', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'changeCommitment', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'changeIndex', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;
