// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeploySepolia
 * @notice Deploys all contracts on Sepolia with correct nonce for valid hook
 */
contract DeploySepolia is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 5;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Deployment - Sepolia");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);
        console2.log("");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);

        uint256 currentNonce = vm.getNonce(deployer);
        console2.log("Current nonce:", currentNonce);
        console2.log("");

        // Find nonce that gives valid hook address (starting after current)
        console2.log("Finding nonce for valid hook address...");

        for (uint256 nonce = currentNonce + 1; nonce < currentNonce + 50000; nonce++) {
            address predicted = vm.computeCreateAddress(deployer, nonce);

            if ((uint160(predicted) & BEFORE_ADD_LIQUIDITY_FLAG) != 0) {
                console2.log("Found valid nonce:", nonce);
                console2.log("Hook address:", predicted);
                console2.log("");
                console2.log("Current nonce is", currentNonce, "- need to reach nonce", nonce);
                console2.log("You have", nonce - currentNonce, "deployments to make first");
                console2.log("");
                console2.log("Or use a fresh account with no transactions");
                return;
            }
        }

        console2.log("No valid nonce found in range");
    }
}
