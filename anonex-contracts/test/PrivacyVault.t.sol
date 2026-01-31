// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../PrivacyVault.sol";
import "../mocks/MockZKVerifier.sol";

contract PrivacyVaultTest is Test {
    PrivacyVault private vault;
    MockZKVerifier private verifier;
    
    function setUp() public {
        verifier = new MockZKVerifier();
        vault = new PrivacyVault(address(verifier));
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
    
    // =============================================================================
    // EXECUTE ACTION TESTS (Spend + Change Flow)
    // =============================================================================
    
    function test_ExecuteAction_Success() public {
        // First make a deposit to have funds in the system
        bytes32 depositNullifier = keccak256("deposit_nullifier");
        bytes32 depositCommitment = keccak256("deposit_commitment");
        
        vm.deal(address(this), 2 ether);
        vault.depositWithPermit{value: 2 ether}(
            address(0),
            2 ether,
            depositCommitment,
            depositNullifier,
            createPermit(),
            createSignature()
        );
        
        bytes32 root = vault.getMerkleRoot();
        bytes32 nullifierHash = keccak256("spend_nullifier");
        bytes32 changeCommitment = keccak256("change_commitment");
        
        // Create Uniswap parameters
        bytes32 poolId = keccak256("pool");
        int24 tickLower = -100;
        int24 tickUpper = 100;
        uint256 amount0 = 1 ether;
        uint256 amount1 = 0;
        
        bytes memory uniswapParams = abi.encode(poolId, tickLower, tickUpper, amount0, amount1);
        bytes32 actionHash = vault.computeActionHash(poolId, tickLower, tickUpper, amount0, amount1);
        
        // Create a mock proof (any non-empty data works with MockZKVerifier)
        bytes memory proof = hex"1234";
        
        uint256 investAmount = 1 ether;
        
        // Execute action - should succeed
        vault.executeAction(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            actionHash,
            investAmount,
            uniswapParams
        );
        
        // Verify nullifier is marked as spent
        assertTrue(vault.isNullifierUsed(nullifierHash), "Nullifier should be marked as spent");
        
        // Verify change commitment was added
        assertTrue(vault.commitments(changeCommitment), "Change commitment should exist");
        
        // Verify tree was updated
        assertEq(vault.getLeafCount(), 2, "Should have 2 leaves after change");
    }
    
    function test_ExecuteAction_RevertOnDoubleSpend() public {
        // Setup initial deposit
        bytes32 depositNullifier = keccak256("deposit_nullifier_2");
        bytes32 depositCommitment = keccak256("deposit_commitment_2");
        
        vm.deal(address(this), 2 ether);
        vault.depositWithPermit{value: 2 ether}(
            address(0),
            2 ether,
            depositCommitment,
            depositNullifier,
            createPermit(),
            createSignature()
        );
        
        bytes32 root = vault.getMerkleRoot();
        bytes32 nullifierHash = keccak256("double_spend_nullifier");
        bytes32 changeCommitment = keccak256("double_spend_change");
        
        bytes32 poolId = keccak256("pool2");
        bytes memory uniswapParams = abi.encode(poolId, int24(-100), int24(100), uint256(1 ether), uint256(0));
        bytes32 actionHash = vault.computeActionHash(poolId, int24(-100), int24(100), 1 ether, 0);
        
        bytes memory proof = hex"1234";
        
        // First execution - should succeed
        vault.executeAction(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            actionHash,
            1 ether,
            uniswapParams
        );
        
        // Second execution with same nullifier - should revert
        vm.expectRevert("Nullifier already spent");
        vault.executeAction(
            proof,
            root,
            nullifierHash, // Same nullifier
            keccak256("different_change"),
            actionHash,
            1 ether,
            uniswapParams
        );
    }
    
    function test_ExecuteAction_RevertOnInvalidRoot() public {
        bytes32 invalidRoot = keccak256("invalid_root");
        bytes32 nullifierHash = keccak256("root_test_nullifier");
        bytes32 changeCommitment = keccak256("root_test_change");
        
        bytes32 poolId = keccak256("pool3");
        bytes memory uniswapParams = abi.encode(poolId, int24(-100), int24(100), uint256(1 ether), uint256(0));
        bytes32 actionHash = vault.computeActionHash(poolId, int24(-100), int24(100), 1 ether, 0);
        
        bytes memory proof = hex"1234";
        
        vm.expectRevert("Invalid Merkle root");
        vault.executeAction(
            proof,
            invalidRoot,
            nullifierHash,
            changeCommitment,
            actionHash,
            1 ether,
            uniswapParams
        );
    }
    
    function test_ExecuteAction_RevertOnZeroActionHash() public {
        // Setup
        bytes32 depositNullifier = keccak256("zero_hash_deposit_nullifier");
        bytes32 depositCommitment = keccak256("zero_hash_deposit_commitment");
        
        vm.deal(address(this), 2 ether);
        vault.depositWithPermit{value: 2 ether}(
            address(0),
            2 ether,
            depositCommitment,
            depositNullifier,
            createPermit(),
            createSignature()
        );
        
        bytes32 root = vault.getMerkleRoot();
        bytes32 nullifierHash = keccak256("zero_hash_spend_nullifier");
        bytes32 changeCommitment = keccak256("zero_hash_change");
        
        bytes32 poolId = keccak256("pool4");
        bytes memory uniswapParams = abi.encode(poolId, int24(-100), int24(100), uint256(1 ether), uint256(0));
        
        bytes memory proof = hex"1234";
        
        // Should revert with zero action hash
        vm.expectRevert("Invalid action hash");
        vault.executeAction(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            bytes32(0), // Zero action hash
            1 ether,
            uniswapParams
        );
    }
    
    function test_ExecuteAction_RevertOnZeroChangeCommitment() public {
        // Setup
        bytes32 depositNullifier = keccak256("zero_change_deposit");
        bytes32 depositCommitment = keccak256("zero_change_commitment");
        
        vm.deal(address(this), 2 ether);
        vault.depositWithPermit{value: 2 ether}(
            address(0),
            2 ether,
            depositCommitment,
            depositNullifier,
            createPermit(),
            createSignature()
        );
        
        bytes32 root = vault.getMerkleRoot();
        bytes32 nullifierHash = keccak256("zero_change_spend");
        bytes32 poolId = keccak256("pool5");
        bytes memory uniswapParams = abi.encode(poolId, int24(-100), int24(100), uint256(1 ether), uint256(0));
        bytes32 actionHash = vault.computeActionHash(poolId, int24(-100), int24(100), 1 ether, 0);
        
        bytes memory proof = hex"1234";
        
        // Should revert with zero change commitment
        vm.expectRevert("Invalid change commitment");
        vault.executeAction(
            proof,
            root,
            nullifierHash,
            bytes32(0), // Zero change commitment
            actionHash,
            1 ether,
            uniswapParams
        );
    }
    
    function test_ComputeActionHash() public {
        bytes32 poolId = keccak256("test_pool");
        int24 tickLower = -100;
        int24 tickUpper = 100;
        uint256 amount0 = 1 ether;
        uint256 amount1 = 0;
        
        bytes32 actionHash = vault.computeActionHash(poolId, tickLower, tickUpper, amount0, amount1);
        
        // Should be deterministic
        bytes32 actionHash2 = vault.computeActionHash(poolId, tickLower, tickUpper, amount0, amount1);
        assertEq(actionHash, actionHash2, "Action hash should be deterministic");
        
        // Should change with different inputs
        bytes32 actionHash3 = vault.computeActionHash(poolId, tickLower, tickUpper, amount0 + 1, amount1);
        assertTrue(actionHash != actionHash3, "Action hash should change with different inputs");
    }
    
    function test_UpdateVerifier() public {
        MockZKVerifier newVerifier = new MockZKVerifier();
        
        vault.updateVerifier(address(newVerifier));
        
        assertEq(address(vault.verifier()), address(newVerifier), "Verifier should be updated");
    }
    
    function test_RevertUpdateVerifierNotOwner() public {
        MockZKVerifier newVerifier = new MockZKVerifier();
        
        vm.prank(address(0x1234)); // Different address
        vm.expectRevert("Not owner");
        vault.updateVerifier(address(newVerifier));
    }
    
    function test_FullSpendAndChangeFlow() public {
        // Step 1: Deposit 2 ETH
        bytes32 depositNullifier = keccak256("flow_deposit_nullifier");
        bytes32 depositCommitment = keccak256("flow_deposit_commitment");
        
        vm.deal(address(this), 2 ether);
        uint256 depositIndex = vault.depositWithPermit{value: 2 ether}(
            address(0),
            2 ether,
            depositCommitment,
            depositNullifier,
            createPermit(),
            createSignature()
        );
        
        assertEq(depositIndex, 0, "First deposit at index 0");
        assertEq(vault.getLeafCount(), 1, "1 leaf after deposit");
        
        bytes32 rootBefore = vault.getMerkleRoot();
        
        // Step 2: Execute action - spend 1 ETH, get 1 ETH change
        bytes32 spendNullifier = keccak256("flow_spend_nullifier");
        bytes32 changeCommitment = keccak256("flow_change_commitment");
        
        bytes32 poolId = keccak256("flow_pool");
        int24 tickLower = -100;
        int24 tickUpper = 100;
        uint256 investAmount = 1 ether;
        
        bytes memory uniswapParams = abi.encode(poolId, tickLower, tickUpper, investAmount, uint256(0));
        bytes32 actionHash = vault.computeActionHash(poolId, tickLower, tickUpper, investAmount, 0);
        
        bytes memory proof = hex"1234";
        
        vault.executeAction(
            proof,
            rootBefore,
            spendNullifier,
            changeCommitment,
            actionHash,
            investAmount,
            uniswapParams
        );
        
        // Verify state after execution
        assertTrue(vault.isNullifierUsed(spendNullifier), "Spend nullifier used");
        assertTrue(vault.commitments(changeCommitment), "Change commitment added");
        assertEq(vault.getLeafCount(), 2, "2 leaves total");
        
        bytes32 rootAfter = vault.getMerkleRoot();
        assertTrue(rootAfter != rootBefore, "Root updated after spend+change");
        
        // Verify events could be checked here with vm.expectEmit
    }
    
    // Helper functions
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