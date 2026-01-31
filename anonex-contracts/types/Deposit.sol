// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Deposit Types
/// @notice Struct definitions for deposit operations
library DepositTypes {
    /// @notice Deposit information structure
    struct Deposit {
        bytes32 commitment;     // H(nullifier, token, amount, salt)
        bytes32 nullifier;      // Unique identifier preventing double-spend
        address token;          // Token address (address(0) for ETH)
        uint256 amount;         // Deposit amount
        uint256 leafIndex;      // Position in Merkle tree
        uint256 timestamp;      // Deposit timestamp
    }
    
    /// @notice Merkle tree leaf structure
    struct MerkleLeaf {
        bytes32 commitment;     // Leaf commitment hash
        uint256 index;          // Leaf index in tree
        bool exists;            // Whether leaf exists
    }
    
    /// @notice Tree state information
    struct TreeState {
        bytes32 root;          // Current root hash
        uint256 leafCount;      // Total number of leaves
        uint256 nextIndex;      // Next available index
        bool isFull;           // Whether tree is at capacity
    }
    
    /// @notice Permit deposit parameters
    struct PermitDepositParams {
        address token;          // Token address
        uint256 amount;         // Deposit amount
        bytes32 commitment;     // Commitment hash
        bytes32 nullifier;      // Nullifier
        bytes32 salt;          // Random salt for privacy
    }
}