// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

contract DebugWithdrawTest is Test {
    PrivacyVault public vault;
    MockZKVerifier public verifier;

    address user = address(0x1);

    function setUp() public {
        verifier = new MockZKVerifier();
        vault = new PrivacyVault(address(verifier));

        // Fund vault
        vm.deal(address(vault), 10 ether);
    }

    function testReplicateUserScenario() public {
        // Exact parameters from user's transaction
        bytes memory proof = hex"00";
        bytes32 root = 0x4131e0af671c3c15d03879ead37b949e3c3ad43b04ac6decffbd55f0997e488f;
        bytes32 nullifierHash = 0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6;
        bytes32 changeCommitment = 0x1c0fa973e2c743b567cb3b01c5b1e9844711de6ed36bc749f18f3feca2b24403;
        address payable recipient = payable(0x34EdEB37D1D133705B829bC21Db3F30c743083b5);
        uint256 amount = 100000000000000;

        console2.log("Current vault root:", uint256(vault.currentRoot()));
        console2.log("Expected root:     ", uint256(root));
        console2.log("");

        console2.log("Checking nullifier...");
        bool isUsed = vault.isNullifierUsed(nullifierHash);
        console2.log("Nullifier used?", isUsed);
        console2.log("");

        console2.log("Testing verifier directly...");
        bytes32[] memory publicInputs = new bytes32[](5);
        publicInputs[0] = root;
        publicInputs[1] = nullifierHash;
        publicInputs[2] = changeCommitment;

        // Calculate actionHash (same as contract does)
        bytes32 actionHash = keccak256(abi.encodePacked(recipient, amount));
        publicInputs[3] = actionHash;
        publicInputs[4] = bytes32(amount);

        bool verified = verifier.verify(proof, publicInputs);
        console2.log("Verifier result:", verified);
        console2.log("");

        // Try the withdraw
        console2.log("Attempting withdraw...");

        vm.prank(user);
        try vault.withdraw(
            proof,
            root,
            nullifierHash,
            changeCommitment,
            recipient,
            amount
        ) {
            console2.log("SUCCESS!");
        } catch Error(string memory reason) {
            console2.log("FAILED with reason:");
            console2.log(reason);
        } catch (bytes memory lowLevelData) {
            console2.log("FAILED with low-level error");
            console2.logBytes(lowLevelData);
        }
    }

    function testWithdrawWithCorrectRoot() public {
        // First make a deposit to set the root correctly
        bytes32 commitment1 = keccak256("commitment1");
        bytes32 nullifier1 = keccak256("nullifier1");

        vm.deal(user, 1 ether);
        vm.prank(user);
        vault.deposit{value: 0.1 ether}(commitment1, nullifier1);

        bytes32 currentRoot = vault.currentRoot();
        console2.log("Root after deposit:", uint256(currentRoot));

        // Now try withdraw with correct root
        bytes memory proof = hex"00";
        bytes32 nullifierHash = keccak256(abi.encodePacked("unused_nullifier"));
        bytes32 changeCommitment = keccak256("change1");
        address payable recipient = payable(address(0x999));
        uint256 amount = 0.05 ether;

        vm.prank(user);
        try vault.withdraw(
            proof,
            currentRoot,  // Use actual current root
            nullifierHash,
            changeCommitment,
            recipient,
            amount
        ) {
            console2.log("SUCCESS - Withdraw with correct root worked!");
        } catch Error(string memory reason) {
            console2.log("FAILED:", reason);
        } catch (bytes memory lowLevelData) {
            console2.log("FAILED with low-level error");
            console2.logBytes(lowLevelData);
        }
    }
}
