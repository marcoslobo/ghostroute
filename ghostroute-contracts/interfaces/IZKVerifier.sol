// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IZKVerifier
/// @notice Interface for the Noir ZK proof verifier contract
/// @dev This interface is implemented by the contract generated from Noir circuit
interface IZKVerifier {
    /// @notice Verifies a ZK proof
    /// @param proof The proof data (bytes)
    /// @param publicInputs Array of public inputs in order:
    ///        [root, nullifier_hash, change_commitment, action_hash, invest_amount]
    /// @return valid Whether the proof is valid
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}