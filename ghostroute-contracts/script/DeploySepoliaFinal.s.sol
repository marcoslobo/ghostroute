// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeploySepoliaFinal
 * @notice Deploys all contracts on Sepolia using CREATE2 for deterministic addresses
 */
contract DeploySepoliaFinal is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Deployment - Sepolia (CREATE2)");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);
        console2.log("");

        // Salt found by CREATE2HookMiner (nonce 0)
        bytes32 salt = bytes32(uint256(2));

        // Compute hook address with CREATE2
        bytes memory hookBytecode = type(PrivacyLiquidityHook).creationCode;
        bytes memory hookConstructor = abi.encode(IPoolManager(POOL_MANAGER), address(0));
        bytes memory fullHookBytecode = abi.encodePacked(hookBytecode, hookConstructor);
        
        address predictedHook = computeAddress(deployer, salt, keccak256(fullHookBytecode));
        console2.log("Predicted hook:", predictedHook);
        
        // Verify has correct bit
        bool hasBit = (uint160(predictedHook) & 32) != 0;
        console2.log("Has BEFORE_ADD_LIQUIDITY bit:", hasBit);
        
        if (!hasBit) {
            revert("Invalid hook address");
        }

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockZKVerifier
        console2.log("[1/4] Deploying MockZKVerifier...");
        address verifier = address(new MockZKVerifier());
        console2.log("  -> MockZKVerifier:", verifier);

        // Deploy PrivacyLiquidityHook with CREATE2 (with address(0) for vault)
        console2.log("[2/4] Deploying PrivacyLiquidityHook with CREATE2...");
        address hook = address(new PrivacyLiquidityHook{salt: salt}(
            IPoolManager(POOL_MANAGER),
            address(0) // Will be set after vault deployment
        ));

        // 3. Deploy PrivacyVault with hook address
        console2.log("[3/4] Deploying PrivacyVault...");
        address vault = address(new PrivacyVault(verifier, hook));
        console2.log("  -> PrivacyVault:", vault);

        // 4. Set vault address in hook
        console2.log("[4/4] Setting PrivacyVault address in hook...");
        PrivacyLiquidityHook(hook).setPrivacyVault(vault);
        console2.log("  -> Vault initialized:", PrivacyLiquidityHook(hook).isVaultInitialized());

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

    function computeAddress(address deployer, bytes32 salt, bytes32 bytecodeHash) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, bytecodeHash)))));
    }
}
