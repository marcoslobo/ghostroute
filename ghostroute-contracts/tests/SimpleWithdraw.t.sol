// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

contract SimpleWithdrawTest is Test {
    PrivacyVault public vault;
    MockZKVerifier public verifier;
    address user = address(0x123);

    function setUp() public {
        verifier = new MockZKVerifier();
        vault = new PrivacyVault(address(verifier));
        vm.deal(address(vault), 100 ether);
        vm.deal(user, 10 ether);
    }

    function testSimpleDepositAndWithdraw() public {
        console2.log("=== Test: Simple Deposit and Withdraw ===");
        console2.log("");
        
        // 1. Make a simple deposit
        bytes32 commitment = bytes32(uint256(1));
        bytes32 nullifier = bytes32(uint256(2));
        uint256 depositAmount = 0.01 ether;
        
        console2.log("1. Depositing 0.01 ETH...");
        vm.prank(user);
        uint256 leafIndex = vault.deposit{value: depositAmount}(commitment, nullifier);
        console2.log("   Leaf index:", leafIndex);
        
        bytes32 root = vault.currentRoot();
        console2.log("   Root:", uint256(root));
        console2.log("");
        
        // 2. Try to withdraw half
        console2.log("2. Withdrawing 0.005 ETH (half)...");
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(3)); // Different from deposit nullifier
        bytes32 changeCommitment = bytes32(uint256(4));
        address payable recipient = payable(address(0x999));
        uint256 withdrawAmount = 0.005 ether;
        
        uint256 balanceBefore = recipient.balance;
        console2.log("   Recipient balance before:", balanceBefore);
        
        vm.prank(user);
        vault.withdraw(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            recipient,
            withdrawAmount
        );
        
        uint256 balanceAfter = recipient.balance;
        console2.log("   Recipient balance after:", balanceAfter);
        console2.log("   Received:", balanceAfter - balanceBefore);
        console2.log("");
        
        assertEq(balanceAfter - balanceBefore, withdrawAmount, "Should receive withdraw amount");
        console2.log("SUCCESS!");
    }

    function testWithdrawFullAmount() public {
        console2.log("=== Test: Withdraw Full Amount ===");
        console2.log("");
        
        // Deposit
        bytes32 commitment = bytes32(uint256(10));
        bytes32 nullifier = bytes32(uint256(20));
        uint256 depositAmount = 1000; // Very small amount: 1000 wei
        
        console2.log("1. Depositing 1000 wei...");
        vm.prank(user);
        vault.deposit{value: depositAmount}(commitment, nullifier);
        
        bytes32 root = vault.currentRoot();
        console2.log("   Root:", uint256(root));
        console2.log("");
        
        // Withdraw all
        console2.log("2. Withdrawing all 1000 wei...");
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(30));
        bytes32 changeCommitment = bytes32(uint256(40)); // Change will be 0
        address payable recipient = payable(address(0x888));
        
        vm.prank(user);
        vault.withdraw(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            recipient,
            depositAmount // Withdraw everything
        );
        
        console2.log("   SUCCESS! Full withdraw worked!");
        assertEq(recipient.balance, depositAmount);
    }

    function testUserExactScenario() public {
        console2.log("=== Test: User's Exact Amount (0.0001 ETH) ===");
        console2.log("");
        
        // User's note has 0.0001 ETH
        bytes32 commitment = bytes32(uint256(100));
        bytes32 nullifier = bytes32(uint256(200));
        uint256 noteAmount = 100000000000000; // 0.0001 ETH = 1e14 wei
        
        console2.log("1. Depositing 0.0001 ETH (100000000000000 wei)...");
        vm.prank(user);
        vault.deposit{value: noteAmount}(commitment, nullifier);
        
        bytes32 root = vault.currentRoot();
        console2.log("   Root:", uint256(root));
        console2.log("");
        
        // Try to withdraw all
        console2.log("2. Withdrawing full amount...");
        bytes memory proof = hex"00";
        bytes32 nullifierHash = bytes32(uint256(300));
        bytes32 changeCommitment = bytes32(uint256(400));
        address payable recipient = payable(address(0x777));
        
        uint256 balanceBefore = recipient.balance;
        
        vm.prank(user);
        vault.withdraw(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            recipient,
            noteAmount
        );
        
        uint256 received = recipient.balance - balanceBefore;
        console2.log("   Received:", received);
        console2.log("   Expected:", noteAmount);
        console2.log("");
        
        assertEq(received, noteAmount);
        console2.log("SUCCESS! Withdraw of 0.0001 ETH worked!");
    }
}
