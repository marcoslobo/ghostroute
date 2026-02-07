// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeploySepoliaFinal2
 * @notice Final deployment script - deploys all contracts
 */
contract DeploySepoliaFinal2 is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Deployment - Sepolia");
        console2.log("========================================");

        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console2.log("Deployer:", deployer);
        console2.log("Nonce:", vm.getNonce(deployer));
        console2.log("");

        vm.startBroadcast(pk);

        // Deploy hook first (vault = address(0) temporarily)
        console2.log("[1] Deploying PrivacyLiquidityHook...");
        address hook = address(new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            address(0)
        ));
        console2.log("  Hook:", hook);

        // Deploy verifier
        console2.log("[2] Deploying MockZKVerifier...");
        address verifier = address(new MockZKVerifier());
        console2.log("  Verifier:", verifier);

        // Deploy vault
        console2.log("[3] Deploying PrivacyVault...");
        address vault = address(new PrivacyVault(verifier, hook));
        console2.log("  Vault:", vault);

        // Set vault in hook
        console2.log("[4] Setting vault in hook...");
        PrivacyLiquidityHook(hook).setPrivacyVault(vault);
        console2.log("  Done!");

        vm.stopBroadcast();

        console2.log("");
        console2.log("========================================");
        console2.log("  DEPLOYED CONTRACTS:");
        console2.log("========================================");
        console2.log("PrivacyVault:    ", vault);
        console2.log("PrivacyHook:     ", hook);
        console2.log("MockVerifier:    ", verifier);
        console2.log("");
        console2.log("ENV VARS:");
        console2.log("NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=", vm.toString(vault));
        console2.log("NEXT_PUBLIC_PRIVACY_HOOK_ADDRESS=", vm.toString(hook));
        console2.log("========================================");
    }
}
