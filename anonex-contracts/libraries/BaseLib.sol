// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PrivacyVault Errors
/// @notice Custom error definitions for PrivacyVault contract
library PrivacyVaultErrors {
    error NullifierAlreadyUsed(bytes32 nullifier);
    error InvalidCommitment();
    error TreeAtCapacity();
    error InvalidPermitSignature();
    error InsufficientAllowance();
    error InvalidTokenAmount();
    error ZeroAddress();
    error PermitExpired();
    error InvalidSignatureDeadline();
    error TreeHeightFixed();
    error MerkleProofInvalid();
    error ReentrancyDetected();
}

/// @title PrivacyVault Events
/// @notice Event definitions for PrivacyVault contract
library PrivacyVaultEvents {
    /// @notice Emitted when a new deposit is made
    /// @param commitment The commitment hash of the deposit
    /// @param nullifier The nullifier to prevent double-spending
    /// @param token The deposited token address (address(0) for ETH)
    /// @param amount The deposited amount
    /// @param leafIndex The index of the leaf in the Merkle tree
    /// @param newRoot The new Merkle tree root
    event Deposit(
        bytes32 indexed commitment,
        bytes32 indexed nullifier,
        address indexed token,
        uint256 amount,
        uint256 leafIndex,
        bytes32 newRoot
    );

    /// @notice Emitted when the Merkle tree root is updated
    /// @param oldRoot The previous root
    /// @param newRoot The new root
    /// @param leafCount The total number of leaves
    event MerkleRootUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        uint256 leafCount
    );
}

/// @title ReentrancyGuard
/// @notice Simple reentrancy protection
contract ReentrancyGuard {
    bool private locked = false;
    
    modifier nonReentrant() {
        require(!locked, PrivacyVaultErrors.ReentrancyDetected());
        locked = true;
        _;
        locked = false;
    }
}