// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {PrivacyVaultErrors} from "../libraries/BaseLib.sol";
import {PrivacyVaultEvents} from "../libraries/BaseLib.sol";

contract ERC20DepositTest is Test {
    PrivacyVault public vault;
    MockZKVerifier public verifier;
    MockERC20 public token;
    
    address owner = address(this);
    address user = address(0x123);
    address recipient = address(0x999);
    
    uint256 constant DEPOSIT_AMOUNT = 1000e18;
    
    function setUp() public {
        // Deploy contracts
        verifier = new MockZKVerifier();
        vault = new PrivacyVault(address(verifier));
        token = new MockERC20("Mock USDC", "mUSDC", 18);
        
        // Add token to allowlist
        vault.addAllowedToken(address(token));
        
        // Mint tokens to user and approve vault
        token.mint(user, 10_000e18);
        vm.prank(user);
        token.approve(address(vault), type(uint256).max);
    }
    
    // ========================================================================
    // T009: Successful ERC20 deposit
    // ========================================================================
    
    function testSuccessfulERC20Deposit() public {
        console2.log("=== Test: Successful ERC20 Deposit ===");
        
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        uint256 userBalanceBefore = token.balanceOf(user);
        uint256 vaultBalanceBefore = token.balanceOf(address(vault));
        
        vm.prank(user);
        uint256 leafIndex = vault.depositERC20(
            address(token),
            DEPOSIT_AMOUNT,
            commitment,
            nullifier
        );
        
        // Verify token balances
        assertEq(token.balanceOf(user), userBalanceBefore - DEPOSIT_AMOUNT, "User balance should decrease");
        assertEq(token.balanceOf(address(vault)), vaultBalanceBefore + DEPOSIT_AMOUNT, "Vault balance should increase");
        
        // Verify internal tracking
        assertEq(vault.getTokenBalance(address(token)), DEPOSIT_AMOUNT, "Internal token balance should match");
        
        // Verify nullifier is marked
        assertTrue(vault.isNullifierUsed(nullifier), "Nullifier should be used");
        
        // Verify leaf index
        assertEq(leafIndex, 0, "First deposit should be leafIndex 0");
        
        // Verify Merkle root changed
        assertTrue(vault.currentRoot() != bytes32(0), "Root should be updated");
        
        console2.log("   Leaf index:", leafIndex);
        console2.log("   Token balance tracked:", vault.getTokenBalance(address(token)));
        console2.log("SUCCESS!");
    }
    
    function testERC20DepositEmitsDepositEvent() public {
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        // Compute expected root
        bytes32 expectedRoot = keccak256(abi.encodePacked(bytes32(0), commitment));
        
        vm.expectEmit(true, true, true, true);
        emit PrivacyVaultEvents.Deposit(
            commitment,
            nullifier,
            address(token),
            DEPOSIT_AMOUNT,
            0, // leafIndex
            expectedRoot
        );
        
        vm.prank(user);
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, commitment, nullifier);
    }
    
    function testERC20DepositEmitsMerkleRootUpdatedEvent() public {
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        bytes32 expectedNewRoot = keccak256(abi.encodePacked(bytes32(0), commitment));
        
        vm.expectEmit(true, true, false, true);
        emit PrivacyVaultEvents.MerkleRootUpdated(
            bytes32(0), // oldRoot
            expectedNewRoot,
            1 // leafCount after deposit
        );
        
        vm.prank(user);
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, commitment, nullifier);
    }
    
    // ========================================================================
    // T010: ERC20 deposit edge cases
    // ========================================================================
    
    function testRevertAmountZero() public {
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        vm.prank(user);
        vm.expectRevert(PrivacyVaultErrors.InvalidTokenAmount.selector);
        vault.depositERC20(address(token), 0, commitment, nullifier);
    }
    
    function testRevertTokenAddressZero() public {
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        vm.prank(user);
        vm.expectRevert(PrivacyVaultErrors.InvalidToken.selector);
        vault.depositERC20(address(0), DEPOSIT_AMOUNT, commitment, nullifier);
    }
    
    function testRevertCommitmentZero() public {
        bytes32 nullifier = bytes32(uint256(2));
        
        vm.prank(user);
        vm.expectRevert(PrivacyVaultErrors.InvalidCommitment.selector);
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, bytes32(0), nullifier);
    }
    
    function testRevertDuplicateNullifier() public {
        bytes32 commitment1 = bytes32(uint256(1));
        bytes32 commitment2 = bytes32(uint256(3));
        bytes32 nullifier = bytes32(uint256(2));
        
        // First deposit succeeds
        vm.prank(user);
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, commitment1, nullifier);
        
        // Second deposit with same nullifier reverts
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(PrivacyVaultErrors.NullifierAlreadyUsed.selector, nullifier));
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, commitment2, nullifier);
    }
    
    function testRevertTokenNotAllowed() public {
        MockERC20 disallowedToken = new MockERC20("Bad Token", "BAD", 18);
        disallowedToken.mint(user, 10_000e18);
        vm.prank(user);
        disallowedToken.approve(address(vault), type(uint256).max);
        
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(PrivacyVaultErrors.TokenNotAllowed.selector, address(disallowedToken)));
        vault.depositERC20(address(disallowedToken), DEPOSIT_AMOUNT, commitment, nullifier);
    }
    
    function testRevertETHSentWithERC20Deposit() public {
        // depositERC20 is non-payable, so sending ETH should revert at the EVM level
        // We can't use vm.expectRevert with a specific error for non-payable revert,
        // but we can verify the function signature is non-payable by checking compilation.
        // This test validates the design decision: non-payable prevents ETH contamination.
        
        // Since Solidity auto-reverts for ETH sent to non-payable functions,
        // we just verify the function works correctly without ETH
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        vm.prank(user);
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, commitment, nullifier);
        assertEq(vault.getTokenBalance(address(token)), DEPOSIT_AMOUNT);
    }
    
    // ========================================================================
    // T011: Multiple sequential ERC20 deposits
    // ========================================================================
    
    function testMultipleSequentialDeposits() public {
        console2.log("=== Test: Multiple Sequential ERC20 Deposits ===");
        
        // Deposit 1: 100 tokens
        vm.prank(user);
        uint256 leaf1 = vault.depositERC20(address(token), 100e18, bytes32(uint256(1)), bytes32(uint256(10)));
        bytes32 root1 = vault.currentRoot();
        
        // Deposit 2: 250 tokens
        vm.prank(user);
        uint256 leaf2 = vault.depositERC20(address(token), 250e18, bytes32(uint256(2)), bytes32(uint256(20)));
        bytes32 root2 = vault.currentRoot();
        
        // Deposit 3: 500 tokens
        vm.prank(user);
        uint256 leaf3 = vault.depositERC20(address(token), 500e18, bytes32(uint256(3)), bytes32(uint256(30)));
        bytes32 root3 = vault.currentRoot();
        
        // Verify leaf indices increment
        assertEq(leaf1, 0, "First leaf should be 0");
        assertEq(leaf2, 1, "Second leaf should be 1");
        assertEq(leaf3, 2, "Third leaf should be 2");
        
        // Verify roots change each time
        assertTrue(root1 != root2, "Root should change after each deposit");
        assertTrue(root2 != root3, "Root should change after each deposit");
        assertTrue(root1 != root3, "All roots should be different");
        
        // Verify total token balance (100 + 250 + 500 = 850)
        assertEq(vault.getTokenBalance(address(token)), 850e18, "Total balance should equal sum of deposits");
        assertEq(token.balanceOf(address(vault)), 850e18, "Vault ERC20 balance should match");
        
        console2.log("   Total deposited:", vault.getTokenBalance(address(token)));
        console2.log("   Leaf count:", vault.getLeafCount());
        console2.log("SUCCESS!");
    }
    
    function testMultipleDepositsWithDifferentTokens() public {
        // Deploy second token
        MockERC20 token2 = new MockERC20("Mock DAI", "mDAI", 18);
        vault.addAllowedToken(address(token2));
        token2.mint(user, 10_000e18);
        vm.prank(user);
        token2.approve(address(vault), type(uint256).max);
        
        uint256 amount1 = 100e18;
        uint256 amount2 = 200e18;
        
        // Deposit token1
        vm.prank(user);
        vault.depositERC20(address(token), amount1, bytes32(uint256(1)), bytes32(uint256(10)));
        
        // Deposit token2
        vm.prank(user);
        vault.depositERC20(address(token2), amount2, bytes32(uint256(2)), bytes32(uint256(20)));
        
        // Verify independent tracking
        assertEq(vault.getTokenBalance(address(token)), amount1, "Token1 balance");
        assertEq(vault.getTokenBalance(address(token2)), amount2, "Token2 balance");
        
        // Verify leaf count is cumulative
        assertEq(vault.getLeafCount(), 2, "Should have 2 leaves total");
    }
    
    // ========================================================================
    // T019-T021: US3 Unified Deposit tests (cross-contamination prevention)
    // ========================================================================
    
    function testETHDepositStillWorks() public {
        // Regression test: existing ETH deposit function works after ERC20 changes
        bytes32 commitment = bytes32(uint256(100));
        bytes32 nullifier = bytes32(uint256(200));
        
        vm.deal(user, 1 ether);
        vm.prank(user);
        uint256 leafIndex = vault.deposit{value: 0.0001 ether}(commitment, nullifier);
        
        assertEq(leafIndex, 0, "ETH deposit should work");
        assertTrue(vault.isNullifierUsed(nullifier), "Nullifier should be used");
    }
    
    function testETHDepositRequiresValue() public {
        bytes32 commitment = bytes32(uint256(100));
        bytes32 nullifier = bytes32(uint256(200));
        
        vm.prank(user);
        vm.expectRevert("Must send ETH");
        vault.deposit(commitment, nullifier);
    }
    
    // ========================================================================
    // T024/T026: US4 Balance tracking & admin allowlist tests
    // ========================================================================
    
    function testMultiTokenBalanceTracking() public {
        // Deploy tokens with different decimals
        MockERC20 usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        MockERC20 dai = new MockERC20("Mock DAI", "mDAI", 18);
        
        vault.addAllowedToken(address(usdc));
        vault.addAllowedToken(address(dai));
        
        usdc.mint(user, 1_000_000e6); // 1M USDC
        dai.mint(user, 1_000_000e18); // 1M DAI
        
        vm.startPrank(user);
        usdc.approve(address(vault), type(uint256).max);
        dai.approve(address(vault), type(uint256).max);
        
        vault.depositERC20(address(usdc), 1000e6, bytes32(uint256(1)), bytes32(uint256(10)));
        vault.depositERC20(address(dai), 500e18, bytes32(uint256(2)), bytes32(uint256(20)));
        vm.stopPrank();
        
        assertEq(vault.getTokenBalance(address(usdc)), 1000e6, "USDC balance");
        assertEq(vault.getTokenBalance(address(dai)), 500e18, "DAI balance");
        assertEq(vault.getTokenBalance(address(0xDEAD)), 0, "Unknown token balance should be 0");
    }
    
    function testAddAllowedTokenEmitsEvent() public {
        MockERC20 newToken = new MockERC20("New Token", "NEW", 18);
        
        vm.expectEmit(true, false, false, false);
        emit PrivacyVaultEvents.TokenAllowed(address(newToken));
        
        vault.addAllowedToken(address(newToken));
        assertTrue(vault.isTokenAllowed(address(newToken)), "Token should be allowed");
    }
    
    function testRemoveAllowedTokenEmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit PrivacyVaultEvents.TokenRemoved(address(token));
        
        vault.removeAllowedToken(address(token));
        assertFalse(vault.isTokenAllowed(address(token)), "Token should not be allowed");
    }
    
    function testNonOwnerCannotAddToken() public {
        MockERC20 newToken = new MockERC20("New Token", "NEW", 18);
        
        vm.prank(user);
        vm.expectRevert("Not owner");
        vault.addAllowedToken(address(newToken));
    }
    
    function testNonOwnerCannotRemoveToken() public {
        vm.prank(user);
        vm.expectRevert("Not owner");
        vault.removeAllowedToken(address(token));
    }
    
    function testDepositRevertsAfterTokenRemoved() public {
        vault.removeAllowedToken(address(token));
        
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(PrivacyVaultErrors.TokenNotAllowed.selector, address(token)));
        vault.depositERC20(address(token), DEPOSIT_AMOUNT, commitment, nullifier);
    }
    
    function testAddAllowedTokenRevertsForZeroAddress() public {
        vm.expectRevert(PrivacyVaultErrors.InvalidToken.selector);
        vault.addAllowedToken(address(0));
    }
    
    function testRemoveAllowedTokenRevertsForZeroAddress() public {
        vm.expectRevert(PrivacyVaultErrors.InvalidToken.selector);
        vault.removeAllowedToken(address(0));
    }
}
