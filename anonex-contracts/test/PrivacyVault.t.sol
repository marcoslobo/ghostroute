// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../PrivacyVault.sol";

contract PrivacyVaultTest is Test {
    PrivacyVault private vault;
    
    function setUp() public {
        vault = new PrivacyVault();
    }
    
    function test_BasicDeposit() public {
        // Test basic deposit functionality
        bytes32 nullifier = keccak256("test_nullifier");
        bytes32 commitment = keccak256("test_commitment");
        
        vm.deal(address(this), 1 ether);
        
        uint256 index = vault.depositWithPermit{value: 1 ether}(
            address(0), // ETH
            1 ether,
            commitment,
            nullifier,
            createPermit(),
            createSignature()
        );
        
        assertEq(index, 0, "First deposit should have index 0");
        assertEq(vault.getLeafCount(), 1, "Should have 1 leaf");
        assertTrue(vault.isNullifierUsed(nullifier), "Nullifier should be marked as used");
    }
    
    function test_RevertOnDuplicateNullifier() public {
        bytes32 nullifier = keccak256("duplicate_test");
        bytes32 commitment = keccak256("commitment_1");
        
        vm.deal(address(this), 2 ether);
        
        // First deposit
        vault.depositWithPermit{value: 1 ether}(
            address(0),
            1 ether,
            commitment,
            nullifier,
            createPermit(),
            createSignature()
        );
        
        // Second deposit with same nullifier should fail
        vm.expectRevert();
        vault.depositWithPermit{value: 1 ether}(
            address(0),
            1 ether,
            keccak256("commitment_2"),
            nullifier, // Same nullifier
            createPermit(),
            createSignature()
        );
    }
    
    function test_TreeInfo() public {
        (bytes32 root, uint256 count, uint256 maxLeaves, uint8 height) = vault.getTreeInfo();
        
        assertEq(count, 0, "Initial count should be 0");
        assertEq(maxLeaves, 1048576, "Max leaves should be 2^20");
        assertEq(height, 20, "Tree height should be 20");
    }
    
    function createPermit() internal pure returns (IPermit2.PermitSingle memory) {
        return IPermit2.PermitSingle({
            details: IPermit2.PermitDetails({
                token: address(0),
                amount: 0,
                expiration: 0,
                nonce: 0
            }),
            spender: address(0),
            sigDeadline: 0
        });
    }
    
    function createSignature() internal pure returns (bytes memory) {
        return new bytes(0);
    }
}