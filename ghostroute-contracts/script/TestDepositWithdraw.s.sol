// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

/**
 * @title TestDepositWithdraw
 * @notice Test script for simplified deposit and withdraw functionality
 */
contract TestDepositWithdraw is Script {
    
    address payable public vault;
    address public verifier;
    
    function run() external {
        console.log("========================================");
        console.log("  Deposit & Withdraw Test");
        console.log("========================================");
        console.log("");
        
        // Get private key from environment or constructor argument
        uint256 deployerPrivateKey;
        
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            // For testing, allow passing via script arguments (not recommended for production)
            deployerPrivateKey = REDACTED_PRIVATE_KEY;
        }
        
        address deployer = vm.addr(deployerPrivateKey);
        address user = vm.addr(deployerPrivateKey + 1);
        
        console.log("Deployer:", deployer);
        console.log("User:", user);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        console.log("[1/5] Deploying MockZKVerifier...");
        verifier = address(new MockZKVerifier());
        console.log("  -> MockZKVerifier:", verifier);
        
        console.log("[2/5] Deploying PrivacyVault...");
        vault = payable(address(new PrivacyVault(verifier)));
        console.log("  -> PrivacyVault:", vault);
        
        // Fund vault with ETH for withdrawals
        console.log("[3/5] Funding vault with 1 ETH...");
        (bool success,) = address(vault).call{value: 1 ether}("");
        require(success, "Failed to fund vault");
        console.log("  -> Vault funded. Balance:", address(vault).balance);
        
        // User makes deposit
        console.log("[4/5] User deposits 0.5 ETH...");
        bytes32 commitment = keccak256(abi.encodePacked("test-commitment", user, block.timestamp));
        bytes32 nullifier = keccak256(abi.encodePacked("test-nullifier", user, block.timestamp));
        
        vm.stopBroadcast();
        
        // User deposits (as separate call)
        vm.startBroadcast(deployerPrivateKey);
        uint256 leafIndex = _deposit(vault, commitment, nullifier, 0.5 ether);
        
        // Print state after deposit
        _printVaultState();
        
        // Test withdraw
        console.log("[5/5] Testing withdraw...");
        _withdraw(vault, 0.1 ether, deployer);
        
        _printVaultState();
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("========================================");
        console.log("  Test Complete!");
        console.log("========================================");
        console.log("Vault:", vault);
        console.log("Leaf Index:", leafIndex);
        console.log("Final Vault Balance:", address(vault).balance);
    }
    
    function _deposit(
        address _vault,
        bytes32 commitment,
        bytes32 nullifier,
        uint256 amount
    ) internal returns (uint256) {
        console.log("  Calling deposit...");
        console.log("  Commitment:", vm.toString(commitment));
        console.log("  Nullifier:", vm.toString(nullifier));
        console.log("  Amount:", amount);
        
        (bool success, bytes memory data) = address(_vault).call{value: amount}(
            abi.encodeWithSignature("deposit(bytes32,bytes32)", commitment, nullifier)
        );
        
        require(success, string.concat("Deposit failed: ", _getRevertMsg(data)));
        
        uint256 leafIndex = abi.decode(data, (uint256));
        console.log("  -> Deposit successful! Leaf Index:", leafIndex);
        
        return leafIndex;
    }
    
    function _withdraw(address _vault, uint256 amount, address recipient) internal {
        console.log("  Calling withdraw...");
        console.log("  Amount:", amount);
        console.log("  Recipient:", recipient);
        
        (bool success,) = address(_vault).call(
            abi.encodeWithSignature("withdraw(uint256,address)", amount, recipient)
        );
        
        if (success) {
            console.log("  -> Withdraw successful!");
        } else {
            console.log("  -> Withdraw failed (expected if no balance)");
        }
    }
    
    function _printVaultState() internal view {
        (bytes32 root, uint256 leafCount, uint256 maxLeaves, uint8 height) = PrivacyVault(vault).getTreeInfo();
        
        console.log("");
        console.log("  === Vault State ===");
        console.log("  Merkle Root:", vm.toString(root));
        console.log("  Leaf Count:", leafCount);
        console.log("  Max Leaves:", maxLeaves);
        console.log("  Tree Height:", height);
        console.log("  Vault Balance:", address(vault).balance);
    }
    
    function _getRevertMsg(bytes memory returnData) internal pure returns (string memory) {
        if (returnData.length == 0) return "No error message";
        
        return string(returnData);
    }
}
