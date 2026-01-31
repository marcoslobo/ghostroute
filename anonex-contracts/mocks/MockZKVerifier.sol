// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IZKVerifier.sol";

/// @title MockZKVerifier
/// @notice Mock implementation of ZKVerifier for testing
/// @dev Simulates proof verification for development and testing
contract MockZKVerifier is IZKVerifier {
    
    /// @notice Mapping of explicitly invalid proofs for testing
    mapping(bytes32 => bool) private invalidProofs;
    
    /// @notice For testing: mark a proof as invalid
    function setInvalidProof(bytes32 proofHash) external {
        invalidProofs[proofHash] = true;
    }
    
    /// @notice For testing: clear invalid status
    function clearInvalidProof(bytes32 proofHash) external {
        invalidProofs[proofHash] = false;
    }
    
    /// @notice Mock verification - accepts any proof for testing
    /// @param proof The proof data
    /// @param publicInputs Array of public inputs (ignored in mock)
    /// @return valid Returns true unless explicitly marked as invalid
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view override returns (bool) {
        // Accept any proof length (even empty) for maximum test flexibility
        // In production, this would validate proof format
        
        // Only reject if explicitly marked as invalid
        bytes32 proofHash = keccak256(proof);
        return !invalidProofs[proofHash];
    }
}