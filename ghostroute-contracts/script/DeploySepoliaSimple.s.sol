// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeploySepoliaSimple
 * @notice Simple deployment - just deploy hook, vault, and link them
 */
contract DeploySepoliaSimple is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Simple Deployment - Sepolia");
        console2.log("========================================");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("Deployer:", deployer);
        console2.log("Nonce before:", vm.getNonce(deployer));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy hook first (with address(0) for vault)
        console2.log("\n[1/3] Deploying PrivacyLiquidityHook...");
        address hook = address(new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            address(0)  // temporary
        ));
        console2.log("  Hook:", hook);
        console2.log("  Nonce after:", vm.getNonce(deployer));

        // Deploy verifier
        console2.log("\n[2/3] Deploying MockZKVerifier...");
        address verifier = address(new MockZKVerifier());
        console2.log("  Verifier:", verifier);

        // Deploy vault with hook address
        console2.log("\n[3/3] Deploying PrivacyVault...");
        address vault = address(new PrivacyVault(verifier, hook));
        console2.log("  Vault:", vault);

        // Set vault in hook
        console2.log("\n[4/4] Setting vault in hook...");
        PrivacyLiquidityHook(hook).setPrivacyVault(vault);
        console2.log("  Done!");

        vm.stopBroadcast();

        console2.log("\n========================================");
        console2.log("  DEPLOYED:");
        console2.log("  PrivacyVault:    ", vault);
        console2.log("  PrivacyHook:     ", hook);
        console2.log("  MockVerifier:    ", verifier);
        console2.log("========================================");
        
        // Environment variables
        console2.log("\nNEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=", vm.toString(vault));
        console2.log("NEXT_PUBLIC_PRIVACY_HOOK_ADDRESS=", vm.toString(hook));
    }
}
