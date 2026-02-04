// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

/**
 * @title DeployPrivacyVault
 * @notice Deployment script for PrivacyVault on local networks (Anvil)
 * @dev Use DeployAll.s.sol for multi-network deployments
 */
contract DeployPrivacyVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("  PrivacyVault Deployment");
        console.log("========================================");
        console.log("");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock verifier first
        console.log("[1/2] Deploying MockZKVerifier...");
        MockZKVerifier verifier = new MockZKVerifier();
        console.log("  -> MockZKVerifier:", address(verifier));

        // Deploy PrivacyVault
        console.log("[2/2] Deploying PrivacyVault...");
        PrivacyVault vault = new PrivacyVault(address(verifier));
        console.log("  -> PrivacyVault:", address(vault));

        // Fund the vault with some ETH for testing (local only)
        if (block.chainid == 31337) {
            (bool success,) = address(vault).call{value: 10 ether}("");
            require(success, "Failed to fund vault");
            console.log("  -> Vault funded with 10 ETH for testing");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("========================================");
        console.log("  Deployment Complete");
        console.log("========================================");
        console.log("MockZKVerifier:", address(verifier));
        console.log("PrivacyVault:", address(vault));
        console.log("========================================");
    }
}
