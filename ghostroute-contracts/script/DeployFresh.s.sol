// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";

contract DeployFresh is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockZKVerifier
        console.log("Deploying MockZKVerifier...");
        MockZKVerifier verifier = new MockZKVerifier();
        console.log("  MockZKVerifier:", address(verifier));
        
        // 2. Deploy PrivacyVault
        console.log("Deploying PrivacyVault...");
        PrivacyVault vault = new PrivacyVault(address(verifier));
        console.log("  PrivacyVault:", address(vault));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("========================================");
        console.log("Deployment Complete!");
        console.log("========================================");
        console.log("");
        console.log("Update your .env file:");
        console.log("NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=", address(vault));
        console.log("");
    }
}
