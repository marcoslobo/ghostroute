// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

/**
 * @title DeployPrivacyVault
 * @notice Deployment script for PrivacyVault on local networks (Anvil)
 */
contract DeployPrivacyVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Deploying PrivacyVault...");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock verifier first
        MockZKVerifier verifier = new MockZKVerifier();
        console.log("MockVerifier deployed at:", address(verifier));

        // Deploy PrivacyVault
        PrivacyVault vault = new PrivacyVault(address(verifier));
        console.log("Vault deployed at:", address(vault));

        // Fund the vault with some ETH for testing
        (bool success,) = address(vault).call{value: 10 ether}("");
        require(success, "Failed to fund vault");
        console.log("Vault funded with 10 ETH");

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("MockVerifier:", address(verifier));
        console.log("PrivacyVault:", address(vault));
        console.log("==========================\n");
    }
}
