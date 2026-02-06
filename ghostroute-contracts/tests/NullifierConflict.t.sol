// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

contract NullifierConflictTest is Test {
    PrivacyVault public vault;
    MockZKVerifier public verifier;
    address user = address(0x123);

    function setUp() public {
        verifier = new MockZKVerifier();
        vault = new PrivacyVault(address(verifier));
        vm.deal(address(vault), 100 ether);
        vm.deal(user, 10 ether);
    }

    function testNullifierMapping() public {
        console2.log("=== Test: Nullifier Mapping Logic ===");
        console2.log("");
        
        // Simulate deposit
        bytes32 depositNullifier = bytes32(uint256(123));
        bytes32 depositCommitment = bytes32(uint256(456));
        
        console2.log("1. Making deposit with nullifier:");
        console2.logBytes32(depositNullifier);
        
        vm.prank(user);
        vault.deposit{value: 0.01 ether}(depositCommitment, depositNullifier);
        
        console2.log("   Deposit successful");
        console2.log("");
        
        // Check if deposit nullifier is marked as used
        bool isDepositNullifierUsed = vault.isNullifierUsed(depositNullifier);
        console2.log("2. Is deposit nullifier marked as used?", isDepositNullifierUsed);
        console2.log("");
        
        // Now try withdraw with HASHED nullifier
        bytes32 withdrawNullifierHash = keccak256(abi.encodePacked(depositNullifier));
        console2.log("3. Withdraw will use nullifierHash (keccak256 of deposit nullifier):");
        console2.logBytes32(withdrawNullifierHash);
        console2.log("");
        
        // Check if withdrawNullifierHash is already used
        bool isWithdrawHashUsed = vault.isNullifierUsed(withdrawNullifierHash);
        console2.log("4. Is withdrawNullifierHash already used?", isWithdrawHashUsed);
        
        if (isWithdrawHashUsed) {
            console2.log("   ERROR: Hash collision!");
            console2.log("   The hash of deposit nullifier is marked as used!");
        } else {
            console2.log("   OK: No collision, withdraw should work");
        }
        console2.log("");
        
        // Try withdraw
        bytes memory proof = hex"00";
        bytes32 root = vault.currentRoot();
        bytes32 changeCommitment = bytes32(uint256(789));
        address payable recipient = payable(address(0x999));
        uint256 amount = 0.005 ether;
        
        console2.log("5. Attempting withdraw...");
        vm.prank(user);
        try vault.withdraw(
            proof,
            root,
            withdrawNullifierHash,
            changeCommitment,
            recipient,
            amount
        ) {
            console2.log("   SUCCESS!");
        } catch Error(string memory reason) {
            console2.log("   FAILED:", reason);
            
            if (keccak256(bytes(reason)) == keccak256(bytes("Nullifier already spent"))) {
                console2.log("");
                console2.log("   This confirms the bug:");
                console2.log("   - Deposit marked: nullifiers[depositNullifier] = true");
                console2.log("   - Withdraw checks: require(!nullifiers[withdrawNullifierHash])");
                console2.log("   - But somehow withdrawNullifierHash is already used!");
            }
        }
    }

    function testUserExactNullifier() public {
        console2.log("=== Test: User's Exact Nullifier ===");
        console2.log("");
        
        // The exact nullifierHash from user's transaction
        bytes32 userNullifierHash = 0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6;
        
        console2.log("Checking if this nullifierHash is already used in mapping:");
        console2.logBytes32(userNullifierHash);
        
        bool isUsed = vault.isNullifierUsed(userNullifierHash);
        console2.log("Is used?", isUsed);
        console2.log("");
        
        if (!isUsed) {
            console2.log("Not used yet - withdraw should work with this value");
            console2.log("The problem must be elsewhere");
        }
    }
}
