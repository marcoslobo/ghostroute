// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeployFactory
 * @notice Deploys PrivacyVault and PrivacyLiquidityHook atomically in correct order
 */
contract DeployFactory is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 5;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Atomic Deployment - Sepolia");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);

        uint256 currentNonce = vm.getNonce(deployer);
        console2.log("Current nonce:", currentNonce);
        console2.log("");

        // Deploy all contracts in one script without broadcasting first
        // to compute addresses
        console2.log("Computing addresses...");

        // Deploy MockZKVerifier
        address verifier = address(new MockZKVerifier());

        // Compute addresses
        address predictedHook = vm.computeCreateAddress(deployer, currentNonce + 1);
        address predictedVault = vm.computeCreateAddress(deployer, currentNonce + 2);

        console2.log("Predicted Hook:", predictedHook);
        console2.log("  Has BEFORE_ADD_LIQUIDITY:", (uint160(predictedHook) & BEFORE_ADD_LIQUIDITY_FLAG) != 0);
        console2.log("Predicted Vault:", predictedVault);
        console2.log("");

        if ((uint160(predictedHook) & BEFORE_ADD_LIQUIDITY_FLAG) == 0) {
            console2.log("ERROR: Predicted hook does not have required permissions!");
            console2.log("Need to find different deployment strategy.");
            revert("Invalid hook address");
        }

        console2.log("All checks passed! Ready to deploy.");
        console2.log("");
        console2.log("Deploying all contracts...");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PrivacyLiquidityHook first (needs vault address)
        address hook = address(new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            predictedVault // Use predicted vault address
        ));
        console2.log("  -> PrivacyLiquidityHook:", hook);

        // Deploy PrivacyVault with hook address
        address vault = address(new PrivacyVault(verifier, hook));
        console2.log("  -> PrivacyVault:", vault);

        vm.stopBroadcast();

        console2.log("");
        console2.log("========================================");
        console2.log("  Deployment Complete!");
        console2.log("========================================");
        console2.log("");
        console2.log("NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=", vm.toString(vault));
        console2.log("NEXT_PUBLIC_PRIVACY_HOOK_ADDRESS=", vm.toString(hook));
        console2.log("========================================");
    }
}
