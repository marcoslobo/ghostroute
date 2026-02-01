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
 */
contract DeployHook is Script {
    
    /// @notice The PoolManager address (to be set for the target network)
    address public constant POOL_MANAGER = address(0); // TODO: Set for target network
    
    /// @notice The PrivacyVault address (to be set for the target network)
    address public constant PRIVACY_VAULT = address(0); // TODO: Set for target network
    
    /// @notice Hook permission flags
    uint160 constant BEFORE_ADD_LIQUIDITY_FLAG = 1 << 5;
    
    function run() external {
        require(POOL_MANAGER != address(0), "PoolManager address not set");
        require(PRIVACY_VAULT != address(0), "PrivacyVault address not set");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the hook
        // Note: In production, you would use HookMiner to find a salt that produces
        // an address with the correct permission bits set
        PrivacyLiquidityHook hook = new PrivacyLiquidityHook(
            IPoolManager(POOL_MANAGER),
            PRIVACY_VAULT
        );
        
        vm.stopBroadcast();
        
        console.log("Hook deployed at:", address(hook));
        console.log("PoolManager:", POOL_MANAGER);
        console.log("PrivacyVault:", PRIVACY_VAULT);
        
        // Verify hook address has correct permissions
        uint160 hookAddress = uint160(address(hook));
        bool hasPermission = (hookAddress & BEFORE_ADD_LIQUIDITY_FLAG) != 0;
        console.log("Has BEFORE_ADD_LIQUIDITY permission:", hasPermission);
        
        if (!hasPermission) {
            console.log("WARNING: Hook address does not have required permission bits!");
            console.log("Use HookMiner to find a valid deployment salt.");
        }
    }
}
