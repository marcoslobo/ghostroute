// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/Permit2Lib.sol";

/// @title IPrivacyVault
/// @notice Interface for the main PrivacyVault contract
interface IPrivacyVault {
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
    ) external payable returns (uint256 leafIndex);
    
    /// @notice Gets current Merkle tree root
    /// @return Current tree root
    function getMerkleRoot() external view returns (bytes32);
    
    /// @notice Verifies Merkle membership proof
    /// @param leaf Commitment to verify
    /// @param proof Merkle proof array
    /// @param leafIndex Position in tree
    /// @return valid Proof validity
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external view returns (bool);
    
    /// @notice Gets comprehensive tree information
    /// @return root Current tree root
    /// @return leafCount Number of leaves
    /// @return maxLeaves Maximum capacity
    /// @return height Tree height
    function getTreeInfo() external view returns (
        bytes32 root,
        uint256 leafCount,
        uint256 maxLeaves,
        uint8 height
    );
    
    /// @notice Checks if nullifier is already used
    /// @param nullifier Nullifier to check
    /// @return used Whether nullifier is used
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
    
    /// @notice Gets total leaf count
    /// @return count Total number of leaves
    function getLeafCount() external view returns (uint256);
}