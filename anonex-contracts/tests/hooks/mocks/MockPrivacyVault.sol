// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPrivacyVault} from "../../../src/hooks/interfaces/IPrivacyVault.sol";
import {TransientStorage} from "../../../src/libraries/TransientStorage.sol";

/**
 * @title MockPrivacyVault
 * @notice Mock implementation of IPrivacyVault for testing
 * @dev Simulates the PrivacyVault behavior including proof validation and authorization
 */
contract MockPrivacyVault is IPrivacyVault {
    
    using TransientStorage for bytes32;
    
    bytes32 public merkleRoot;
    mapping(bytes32 => bool) public executedActions;
    
    // Mock proof validation - in tests, we can set this to true/false
    bool public mockProofValid = true;
    
    event ProofValidated(bytes32 indexed actionHash, bool isValid);
    event AuthorizationSet(address indexed authorizedAddress);
    
    error InvalidCallData();
    error HookCallFailed();
    
    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }
    
    function executeAction(
        bytes32 actionHash,
        bytes calldata proof,
        bytes calldata data
    ) external override returns (bool success) {
        // Validate the proof
        if (!this.validateProof(actionHash, proof, new bytes32[](0))) {
            revert InvalidProof();
        }
        
        // Check if already executed
        if (executedActions[actionHash]) {
            revert ActionExecutionFailed();
        }
        
        // Mark as executed
        executedActions[actionHash] = true;
        
        // Set authorization in transient storage
        TransientStorage.setAuthorization(msg.sender);
        emit AuthorizationSet(msg.sender);
        
        // For testing purposes, we just emit the event
        // In real implementation, this would decode data and call the hook
        emit ActionExecuted(actionHash, msg.sender, true);
        
        return true;
    }
    
    function validateProof(
        bytes32 actionHash,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view override returns (bool isValid) {
        // Mock validation - returns the mockProofValid flag
        // In real tests, you can set mockProofValid to test different scenarios
        return mockProofValid && proof.length > 0;
    }
    
    function getMerkleRoot() external view override returns (bytes32) {
        return merkleRoot;
    }
    
    function isActionExecuted(bytes32 actionHash) external view override returns (bool) {
        return executedActions[actionHash];
    }
    
    // Test helper functions
    function setMockProofValid(bool _valid) external {
        mockProofValid = _valid;
    }
    
    function setMerkleRoot(bytes32 _root) external {
        merkleRoot = _root;
    }
    
    function resetAction(bytes32 actionHash) external {
        executedActions[actionHash] = false;
    }
    
    function getAuthorization() external view returns (address) {
        return TransientStorage.getAuthorization();
    }
    
    function setAuthorization(address authorized) external {
        TransientStorage.setAuthorization(authorized);
        emit AuthorizationSet(authorized);
    }
}
