// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {MockERC20} from "../mocks/MockERC20.sol";
import {PrivacyVaultErrors} from "../libraries/BaseLib.sol";
import {PrivacyVaultEvents} from "../libraries/BaseLib.sol";

contract ERC20WithdrawTest is Test {
    PrivacyVault public vault;
    MockZKVerifier public verifier;
    MockERC20 public token;
    
    address owner = address(this);
    address user = address(0x123);
    address recipient = address(0x999);
    
    uint256 constant DEPOSIT_AMOUNT = 1000e18;
    uint256 constant WITHDRAW_AMOUNT = 400e18;
    
    // Deposit state captured after setUp
    bytes32 public depositRoot;
    
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
        
        // Make initial deposit so we have tokens in the vault
        vm.prank(user);
        vault.depositERC20(
            address(token),
            DEPOSIT_AMOUNT,
            bytes32(uint256(1)), // commitment
            bytes32(uint256(2))  // nullifier
        );
        
        depositRoot = vault.currentRoot();
    }
    
    // ========================================================================
    // T014: Successful ERC20 withdrawal
    // ========================================================================
    
    function testSuccessfulERC20Withdrawal() public {
        console2.log("=== Test: Successful ERC20 Withdrawal ===");
        
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), WITHDRAW_AMOUNT));
        
        uint256 recipientBefore = token.balanceOf(recipient);
        uint256 vaultTrackingBefore = vault.getTokenBalance(address(token));
        
        vault.withdrawERC20(
            proof,
            depositRoot,
            nullifierHash,
            changeCommitment,
            actionHash,
            address(token),
            recipient,
            WITHDRAW_AMOUNT
        );
        
        // Verify recipient received tokens
        assertEq(
            token.balanceOf(recipient),
            recipientBefore + WITHDRAW_AMOUNT,
            "Recipient should receive tokens"
        );
        
        // Verify internal balance decreased
        assertEq(
            vault.getTokenBalance(address(token)),
            vaultTrackingBefore - WITHDRAW_AMOUNT,
            "Internal balance should decrease"
        );
        
        // Verify nullifier is spent
        assertTrue(vault.isNullifierUsed(nullifierHash), "Nullifier should be spent");
        
        // Verify Merkle root updated
        assertTrue(vault.currentRoot() != depositRoot, "Root should change");
        
        console2.log("   Recipient received:", token.balanceOf(recipient));
        console2.log("   Vault remaining:", vault.getTokenBalance(address(token)));
        console2.log("SUCCESS!");
    }
    
    function testWithdrawERC20EmitsEvents() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), WITHDRAW_AMOUNT));
        
        // Expect AnonymousERC20Withdrawal event
        vm.expectEmit(true, true, true, true);
        emit PrivacyVaultEvents.AnonymousERC20Withdrawal(
            nullifierHash,
            address(token),
            recipient,
            WITHDRAW_AMOUNT,
            changeCommitment,
            1 // changeIndex (leafIndex 0 was deposit, so change is 1)
        );
        
        vault.withdrawERC20(
            proof,
            depositRoot,
            nullifierHash,
            changeCommitment,
            actionHash,
            address(token),
            recipient,
            WITHDRAW_AMOUNT
        );
    }
    
    function testWithdrawFullBalance() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), DEPOSIT_AMOUNT));
        
        vault.withdrawERC20(
            proof,
            depositRoot,
            nullifierHash,
            changeCommitment,
            actionHash,
            address(token),
            recipient,
            DEPOSIT_AMOUNT
        );
        
        assertEq(vault.getTokenBalance(address(token)), 0, "Balance should be zero after full withdrawal");
        assertEq(token.balanceOf(recipient), DEPOSIT_AMOUNT, "Recipient should have full amount");
    }
    
    // ========================================================================
    // T015: ERC20 withdrawal error cases
    // ========================================================================
    
    function testRevertWithdrawAmountZero() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = bytes32(uint256(300));
        
        vm.expectRevert("Invalid amount");
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment, actionHash,
            address(token), recipient, 0
        );
    }
    
    function testRevertWithdrawTokenAddressZero() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = bytes32(uint256(300));
        
        vm.expectRevert(PrivacyVaultErrors.InvalidToken.selector);
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment, actionHash,
            address(0), recipient, WITHDRAW_AMOUNT
        );
    }
    
    function testRevertWithdrawTokenNotAllowed() public {
        MockERC20 badToken = new MockERC20("Bad", "BAD", 18);
        
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = bytes32(uint256(300));
        
        vm.expectRevert(abi.encodeWithSelector(PrivacyVaultErrors.TokenNotAllowed.selector, address(badToken)));
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment, actionHash,
            address(badToken), recipient, WITHDRAW_AMOUNT
        );
    }
    
    function testRevertWithdrawInsufficientBalance() public {
        uint256 tooMuch = DEPOSIT_AMOUNT + 1;
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = bytes32(uint256(300));
        
        vm.expectRevert(
            abi.encodeWithSelector(
                PrivacyVaultErrors.InsufficientTokenBalance.selector,
                address(token),
                DEPOSIT_AMOUNT,
                tooMuch
            )
        );
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment, actionHash,
            address(token), recipient, tooMuch
        );
    }
    
    function testRevertWithdrawNullifierAlreadySpent() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment1 = bytes32(uint256(200));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), WITHDRAW_AMOUNT));
        
        // First withdrawal succeeds
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment1, actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
        
        // Second withdrawal with same nullifier reverts
        bytes32 newRoot = vault.currentRoot();
        bytes32 changeCommitment2 = bytes32(uint256(300));
        
        vm.expectRevert("Nullifier already spent");
        vault.withdrawERC20(
            proof, newRoot, nullifierHash, changeCommitment2, actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
    }
    
    function testRevertWithdrawInvalidRoot() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = bytes32(uint256(300));
        bytes32 fakeRoot = bytes32(uint256(999));
        
        vm.expectRevert("Invalid Merkle root");
        vault.withdrawERC20(
            proof, fakeRoot, nullifierHash, changeCommitment, actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
    }
    
    function testRevertWithdrawZeroChangeCommitment() public {
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), WITHDRAW_AMOUNT));
        
        vm.expectRevert("Invalid change commitment");
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, bytes32(0), actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
    }
    
    function testRevertWithdrawZKProofFails() public {
        // Mark the proof as invalid via mock verifier
        bytes memory proof = hex"00";
        verifier.setInvalidProof(keccak256(proof));
        
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), WITHDRAW_AMOUNT));
        
        vm.expectRevert("ZK proof verification failed");
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment, actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
    }
    
    // ========================================================================
    // T016: Double-spend prevention
    // ========================================================================
    
    function testDoubleSpendPrevention() public {
        console2.log("=== Test: Double-Spend Prevention ===");
        
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(100));
        bytes32 changeCommitment = bytes32(uint256(200));
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), WITHDRAW_AMOUNT));
        
        // First withdrawal succeeds
        vault.withdrawERC20(
            proof, depositRoot, nullifierHash, changeCommitment, actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
        console2.log("   First withdrawal: SUCCESS");
        
        // Attempt second withdrawal with same nullifier
        bytes32 newRoot = vault.currentRoot();
        bytes32 changeCommitment2 = bytes32(uint256(300));
        
        vm.expectRevert("Nullifier already spent");
        vault.withdrawERC20(
            proof, newRoot, nullifierHash, changeCommitment2, actionHash,
            address(token), recipient, WITHDRAW_AMOUNT
        );
        console2.log("   Second withdrawal (same nullifier): CORRECTLY REVERTED");
        console2.log("SUCCESS!");
    }
    
    // ========================================================================
    // T025: Balance tracking through deposit-withdraw cycle
    // ========================================================================
    
    function testBalanceTrackingThroughCycle() public {
        console2.log("=== Test: Balance Tracking Through Deposit-Withdraw Cycle ===");
        
        // Initial state: 1000 tokens deposited in setUp
        assertEq(vault.getTokenBalance(address(token)), 1000e18, "Initial balance");
        
        // Withdraw 400
        bytes memory proof = hex"00";
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, address(token), uint256(400e18)));
        
        vault.withdrawERC20(
            proof, depositRoot, bytes32(uint256(100)), bytes32(uint256(200)),
            actionHash, address(token), recipient, 400e18
        );
        assertEq(vault.getTokenBalance(address(token)), 600e18, "After withdrawal");
        
        // Deposit another 200
        bytes32 newRoot = vault.currentRoot();
        vm.prank(user);
        vault.depositERC20(address(token), 200e18, bytes32(uint256(3)), bytes32(uint256(4)));
        assertEq(vault.getTokenBalance(address(token)), 800e18, "After second deposit");
        
        console2.log("   1000 -> withdraw 400 -> 600 -> deposit 200 -> 800");
        console2.log("   Final balance:", vault.getTokenBalance(address(token)));
        console2.log("SUCCESS!");
    }
}
