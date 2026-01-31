// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IMerkleTree
/// @notice Interface for Merkle Tree operations
interface IMerkleTree {
    /// @notice Inserts a leaf into the tree
    /// @param leaf Leaf to insert
    /// @return index Index of inserted leaf
    function insert(bytes32 leaf) external returns (uint256 index);
    
    /// @notice Gets current tree root
    /// @return root Current root hash
    function root() external view returns (bytes32);
    
    /// @notice Verifies Merkle membership proof
    /// @param leaf Leaf to verify
    /// @param proof Merkle proof array
    /// @param index Leaf index
    /// @return valid Whether proof is valid
    function verify(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 index
    ) external view returns (bool);
    
    /// @notice Gets total leaf count
    /// @return count Number of leaves in tree
    function leafCount() external view returns (uint256);
    
    /// @notice Gets tree height
    /// @return height Tree height
    function getTreeHeight() external pure returns (uint256);
}