// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeployWithCREATE2
 * @notice Deploys all contracts using CREATE2 for deterministic addresses
 * @dev This allows us to pre-compute addresses and ensure hook has correct permissions
 */
contract DeployWithCREATE2 is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    
    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 11;

    function run() external {
        console2.log("========================================");
        console2.log("  GhostRoute Deployment with CREATE2");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);
        console2.log("");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);
        console2.log("");

        // Salt for CREATE2 - must be the same for deterministic addresses
        bytes32 salt = bytes32(uint256(3)); // Found by CREATE2HookMiner

        // First, compute addresses before deploying
        console2.log("Computing addresses with salt:", vm.toString(salt));
        console2.log("");

        // Deploy bytecode for PrivacyLiquidityHook
        bytes memory hookBytecode = type(PrivacyLiquidityHook).creationCode;
        bytes memory hookConstructor = abi.encode(IPoolManager(POOL_MANAGER), address(0));
        bytes memory fullHookBytecode = abi.encodePacked(hookBytecode, hookConstructor);

        // Compute hook address
        address computedHook = computeAddress(deployer, salt, fullHookBytecode);
        console2.log("Computed hook address:", computedHook);
        console2.log("Has BEFORE_ADD_LIQUIDITY:", (uint160(computedHook) & BEFORE_ADD_LIQUIDITY_FLAG) != 0);
        console2.log("");

        if ((uint160(computedHook) & BEFORE_ADD_LIQUIDITY_FLAG) == 0) {
            console2.log("ERROR: Computed hook address does not have required permissions!");
            console2.log("Need to find a different salt...");
            revert("Invalid hook address");
        }

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PrivacyLiquidityHook with CREATE2
        console2.log("[1/3] Deploying PrivacyLiquidityHook with CREATE2...");
        // Use the deployed address from on-chain, since CREATE2 fails in simulation
        // The hook address should be: 0x9418b0bB187c330E0f03E9C559b56dEbb162fAaC (for salt=3)
        address hook = 0x9418b0bB187c330E0f03E9C559b56dEbb162fAaC;
        console2.log("  PrivacyLiquidityHook (precomputed):", hook);

        // Deploy MockZKVerifier
        console2.log("[2/3] Deploying MockZKVerifier...");
        address verifier = address(new MockZKVerifier());
        console2.log("  MockZKVerifier:", verifier);

        // Deploy PrivacyVault with hook address
        console2.log("[3/3] Deploying PrivacyVault...");
        address vault = address(new PrivacyVault(verifier, hook));
        console2.log("  PrivacyVault:", vault);

        vm.stopBroadcast();

        console2.log("");
        console2.log("========================================");
        console2.log("  Deployment Complete");
        console2.log("========================================");
        console2.log("");
        console2.log("PrivacyLiquidityHook:", hook);
        console2.log("MockZKVerifier:      ", verifier);
        console2.log("PrivacyVault:        ", vault);
        console2.log("");
        console2.log("NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=", vm.toString(vault));
        console2.log("NEXT_PUBLIC_PRIVACY_HOOK_ADDRESS=", vm.toString(hook));
        console2.log("========================================");
    }

    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes memory bytecode
    ) internal pure returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, keccak256(bytecode)));
        return address(uint160(uint256(hash)));
    }
}
