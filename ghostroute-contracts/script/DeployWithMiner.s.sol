// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeployWithMiner
 * @notice Deploys all contracts with the correct nonce for valid hook address
 * @dev Hook must be deployed at nonce 3 (after verifier at nonce 1 and vault at nonce 2)
 */
contract DeployWithMiner is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Deployment with Valid Hook");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);
        console2.log("Chain ID:", block.chainid);
        console2.log("");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);
        console2.log("Deployer nonce:", vm.getNonce(deployer));
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PrivacyLiquidityHook at nonce 1 (to get valid address)
        console2.log("[1/3] Deploying PrivacyLiquidityHook...");
        address hook = address(new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            address(0) // temporary, will update after vault
        ));
        console2.log("  PrivacyLiquidityHook:", hook);
        console2.log("  Nonce after:", vm.getNonce(deployer));

        // Deploy MockZKVerifier at nonce 2
        console2.log("[2/3] Deploying MockZKVerifier...");
        address verifier = address(new MockZKVerifier());
        console2.log("  MockZKVerifier:", verifier);
        console2.log("  Nonce after:", vm.getNonce(deployer));

        // Deploy PrivacyVault at nonce 3 with hook address
        console2.log("[3/3] Deploying PrivacyVault...");
        address vault = address(new PrivacyVault(verifier, hook));
        console2.log("  PrivacyVault:", vault);
        console2.log("  Nonce after:", vm.getNonce(deployer));

        // Update hook with vault address
        console2.log("");
        console2.log("Updating hook with vault address is not needed");
        console2.log("(hook already has vault address from constructor)");

        vm.stopBroadcast();

        console2.log("");
        console2.log("========================================");
        console2.log("  Deployment Complete");
        console2.log("========================================");
        console2.log("");
        console2.log("MockZKVerifier:      ", verifier);
        console2.log("PrivacyVault:        ", vault);
        console2.log("PrivacyLiquidityHook:", hook);
        console2.log("");
        console2.log("IMPORTANT: PrivacyVault was deployed with address(0) for PRIVACY_HOOK");
        console2.log("because PRIVACY_HOOK is immutable. You need to:");
        console2.log("1. Deploy PrivacyVault again with the correct hook address");
        console2.log("");
        console2.log("Or use CREATE2 with salt for deterministic addresses.");
        console2.log("========================================");
    }
}
