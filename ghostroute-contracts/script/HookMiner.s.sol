// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title HookMiner
 * @notice Mines for a valid hook address with correct permission bits
 * @dev Hook address must have BEFORE_ADD_LIQUIDITY bit (1 << 5) set
 */
contract HookMiner is Script {
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address public constant VAULT_ADDRESS = address(0); // Will be set after deployment
    
    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 5;
    
    function run() external {
        console2.log("========================================");
        console2.log("  Hook Miner for PrivacyLiquidityHook");
        console2.log("========================================");
        console2.log("");
        console2.log("PoolManager:", POOL_MANAGER);
        console2.log("Required permission: BEFORE_ADD_LIQUIDITY (1 << 5)");
        console2.log("");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console2.log("Deployer:", deployer);
        console2.log("");
        
        // First deploy PrivacyVault to get its address
        console2.log("[1/2] Deploying PrivacyVault first...");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy mock verifier
        address verifier = address(new MockZKVerifier());
        console2.log("  MockZKVerifier:", verifier);
        
        // Deploy vault with temporary address(0) for hook
        address vault = address(new PrivacyVault(verifier, address(0)));
        console2.log("  PrivacyVault:", vault);
        
        vm.stopBroadcast();
        
        // Now mine for hook address
        console2.log("");
        console2.log("[2/2] Mining for valid hook address...");
        console2.log("");
        
        address hookAddress = mineHook(deployerPrivateKey, POOL_MANAGER, vault);
        
        console2.log("");
        console2.log("========================================");
        console2.log("  Hook Address Found!");
        console2.log("========================================");
        console2.log("Hook:", hookAddress);
        console2.log("");
        console2.log("Permissions check:");
        console2.log("  BEFORE_ADD_LIQUIDITY:", (uint160(hookAddress) & BEFORE_ADD_LIQUIDITY_FLAG) != 0);
        console2.log("");
        console2.log("Now re-run DeployHook with this address as deployer");
        console2.log("or update the nonce in DeployHook.s.sol");
        console2.log("========================================");
    }
    
    function mineHook(
        uint256 privateKey,
        address poolManager,
        address vault
    ) internal returns (address) {
        uint256 startNonce = vm.getNonce(vm.addr(privateKey));
        uint256 nonce = startNonce;
        
        while (true) {
            // Create the address that would be created at this nonce
            address predictedAddress = vm.computeCreateAddress(vm.addr(privateKey), nonce);
            
            // Check if it has the required permission bit
            if ((uint160(predictedAddress) & BEFORE_ADD_LIQUIDITY_FLAG) != 0) {
                console2.log("Found valid address at nonce:", nonce);
                console2.log("Address:", predictedAddress);
                return predictedAddress;
            }
            
            nonce++;
            
            // Prevent infinite loop
            if (nonce > startNonce + 100000) {
                console2.log("No valid address found after 100000 attempts");
                console2.log("Try with a different deployer private key");
                revert("No valid hook address found");
            }
        }
    }
}

// Minimal imports for compilation
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
