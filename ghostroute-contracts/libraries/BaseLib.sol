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
    // ERC20 errors
    error InvalidToken();
    error TokenNotAllowed(address token);
    error InsufficientTokenBalance(address token, uint256 balance, uint256 requested);
    error ETHSentForERC20();
    error InvalidAmount();
    error NullifierAlreadySpent();
    error InvalidRoot();
    error InvalidProof();
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

    event AnonymousERC20Withdrawal(
        bytes32 indexed nullifier,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 changeCommitment,
        uint256 changeIndex
    );
    
    event TokenAllowed(address indexed token);
    event TokenRemoved(address indexed token);
    
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
        if (locked) revert PrivacyVaultErrors.ReentrancyDetected();
        locked = true;
        _;
        locked = false;
    }
}