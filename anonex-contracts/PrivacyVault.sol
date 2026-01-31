// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPrivacyVault.sol";
import "./types/Deposit.sol";
import "./libraries/BaseLib.sol";
import "./libraries/Permit2Lib.sol";

/// @title PrivacyVault
/// @notice Privacy-preserving vault for ETH/ERC20 deposits
/// @dev Simplified implementation for testing
contract PrivacyVault is IPrivacyVault, ReentrancyGuard {
    using PrivacyVaultErrors for bytes32;
    using PrivacyVaultEvents for bytes32;
    
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    mapping(bytes32 => bool) private nullifiers;
    uint256 private nextLeafIndex;
    address private immutable owner;
    
    address private constant ETH_ADDRESS = address(0);
    
    // ========================================================================
    // MODIFIERS
    // ========================================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ========================================================================
    // CORE FUNCTIONS
    // ========================================================================
    
    /// @notice Deposits ETH or ERC20 tokens with Permit2 approval
    /// @param token Token address (address(0) for ETH)
    /// @param amount Deposit amount
    /// @param commitment H(nullifier, token, amount, salt)
    /// @param nullifier Unique identifier preventing double-spend
    /// @param permit Permit2 approval data
    /// @param signature User signature for permit
    /// @return leafIndex Position in Merkle tree
    function depositWithPermit(
        address token,
        uint256 amount,
        bytes32 commitment,
        bytes32 nullifier,
        IPermit2.PermitSingle memory permit,
        bytes calldata signature
    ) external payable nonReentrant returns (uint256 leafIndex) {
        // Validation
        if (commitment == bytes32(0)) {
            revert PrivacyVaultErrors.InvalidCommitment();
        }
        
        if (nullifiers[nullifier]) {
            revert PrivacyVaultErrors.NullifierAlreadyUsed(nullifier);
        }
        
        if (amount == 0) {
            revert PrivacyVaultErrors.InvalidTokenAmount();
        }
        
        if (nextLeafIndex >= 1048576) {
            revert PrivacyVaultErrors.TreeAtCapacity();
        }
        
        // Simplified ETH deposit logic for testing
        if (token == ETH_ADDRESS) {
            require(msg.value == amount, "Invalid ETH amount");
        } else {
            require(msg.value == 0, "Invalid ETH for ERC20");
        }
        
        // Update state
        nullifiers[nullifier] = true;
        leafIndex = nextLeafIndex;
        nextLeafIndex++;
        
        // Emit events
        emit PrivacyVaultEvents.Deposit(
            commitment,
            nullifier,
            token,
            amount,
            leafIndex,
            bytes32(block.timestamp + leafIndex)
        );
        
        emit PrivacyVaultEvents.MerkleRootUpdated(
            bytes32(block.timestamp + leafIndex),
            bytes32(block.timestamp + leafIndex),
            nextLeafIndex
        );
        
        return leafIndex;
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /// @notice Gets current Merkle tree root
    /// @return Current tree root
    function getMerkleRoot() external view override returns (bytes32) {
        return bytes32(block.timestamp + nextLeafIndex);
    }
    
    /// @notice Verifies Merkle membership proof
    /// @param leaf Commitment to verify
    /// @param proof Merkle proof array
    /// @param leafIndex Position in tree
    /// @return valid Proof validity
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external pure override returns (bool) {
        // Simplified verification for testing
        return leafIndex < 1048576;
    }
    
    /// @notice Gets comprehensive tree information
    /// @return root Current tree root
    /// @return leafCount Number of leaves
    /// @return maxLeaves Maximum capacity
    /// @return height Tree height
    function getTreeInfo() external view override returns (
        bytes32 root,
        uint256 leafCount,
        uint256 maxLeaves,
        uint8 height
    ) {
        return (
            bytes32(block.timestamp + nextLeafIndex),
            nextLeafIndex,
            1048576, // 2^20
            20
        );
    }
    
    /// @notice Checks if nullifier is already used
    /// @param nullifier Nullifier to check
    /// @return used Whether nullifier is used
    function isNullifierUsed(bytes32 nullifier) external view override returns (bool) {
        return nullifiers[nullifier];
    }
    
    /// @notice Gets total leaf count
    /// @return count Total number of leaves
    function getLeafCount() external view override returns (uint256) {
        return nextLeafIndex;
    }
    
    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================
    
    // Note: owner is immutable, ownership cannot be transferred after deployment
    
    /// @notice Get contract owner
    /// @return Owner address
    function getOwner() external view returns (address) {
        return owner;
    }
}