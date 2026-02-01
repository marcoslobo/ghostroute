// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

/**
 * @title TestUtils
 * @notice Shared test utilities for hook testing
 */
contract TestUtils is Test {
    
    // Common test addresses
    address constant ALICE = address(0x1);
    address constant BOB = address(0x2);
    address constant CHARLIE = address(0x3);
    
    // Test token addresses (mock)
    address constant TOKEN_A = address(0x1000);
    address constant TOKEN_B = address(0x2000);
    
    /**
     * @notice Creates a test merkle root
     */
    function createTestMerkleRoot() internal pure returns (bytes32 merkleRoot) {
        return keccak256(abi.encodePacked("test_merkle_root"));
    }
    
    /**
     * @notice Creates a mock ZK-proof for testing
     */
    function createMockProof() internal pure returns (bytes memory proof) {
        return abi.encodePacked(keccak256(abi.encodePacked("mock_proof")));
    }
    
    /**
     * @notice Creates mock public inputs for testing
     */
    function createMockPublicInputs(bytes32 actionHash) internal pure returns (bytes32[] memory publicInputs) {
        publicInputs = new bytes32[](1);
        publicInputs[0] = actionHash;
        return publicInputs;
    }
    
    /**
     * @notice Sets up test accounts with ETH balance
     */
    function setupTestAccounts() internal {
        vm.deal(ALICE, 100 ether);
        vm.deal(BOB, 100 ether);
        vm.deal(CHARLIE, 100 ether);
    }
}
