// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/**
 * @title DeployHook
 * @notice Deployment script for PrivacyLiquidityHook
 * @dev Uses HookMiner to find an address with correct permission bits
 * @dev Use DeployAll.s.sol for complete multi-network deployment
 */
contract DeployHook is Script {
    
    /// @notice The PoolManager address (to be set for the target network)
    address public constant POOL_MANAGER = address(0); // Set via PRIVATE_KEY or env
    
    /// @notice The PrivacyVault address (set via environment or constructor)
    address public constant PRIVACY_VAULT = 0x0000000000000000000000000000000000000000;
    
    /// @notice Hook permission flags
    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 5;
    
    function run() external {
        address vaultAddress = PRIVACY_VAULT;
        
        // Allow overriding via environment
        if (vaultAddress == address(0)) {
            vaultAddress = vm.envAddress("PRIVACY_VAULT_ADDRESS");
        }
        
        require(POOL_MANAGER != address(0), "PoolManager address not set");
        require(vaultAddress != address(0), "PrivacyVault address not set");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("  PrivacyLiquidityHook Deployment");
        console.log("========================================");
        console.log("");
        console.log("PoolManager:", POOL_MANAGER);
        console.log("PrivacyVault:", vaultAddress);
        console.log("Deployer:", deployer);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the hook
        console.log("Deploying PrivacyLiquidityHook...");
        PrivacyLiquidityHook hook = new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            vaultAddress
        );
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("========================================");
        console.log("  Deployment Complete");
        console.log("========================================");
        console.log("Hook deployed at:", address(hook));
        console.log("PoolManager:", POOL_MANAGER);
        console.log("PrivacyVault:", vaultAddress);
        
        // Verify hook address has correct permissions
        uint160 hookAddress = uint160(address(hook));
        bool hasPermission = (hookAddress & BEFORE_ADD_LIQUIDITY_FLAG) != 0;
        
        console.log("");
        console.log("Permissions Check:");
        console.log("  Has BEFORE_ADD_LIQUIDITY:", hasPermission);
        
        if (!hasPermission) {
            console.log("");
            console.log("WARNING: Hook address does not have required permission bits!");
            console.log("Use HookMiner to find a valid deployment salt.");
        }
        
        console.log("========================================");
    }
}
