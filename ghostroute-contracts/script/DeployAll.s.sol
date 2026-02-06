// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/// @title DeployAll
/// @notice Deployment script for all GhostRoute contracts
/// @dev Supports multiple networks with configuration via environment variables
contract DeployAll is Script {
    
    /// @notice Network configuration structure
    struct NetworkConfig {
        string name;
        address poolManager;
        address weth9;
        uint160 hookPermissions;
        bool isLocal;
    }
    
    /// @notice Deployment results structure
    struct DeploymentResult {
        address verifier;
        address vault;
        address hook;
        uint256 chainId;
        uint256 timestamp;
    }
    
    /// @notice Maps chain ID to network configuration
    mapping(uint256 => NetworkConfig) public networks;
    
    /// @notice Deployment results
    address public verifier;
    address public vault;
    address public hook;
    
    /// @notice Setup - configure networks
    function setUp() public {
        // Anvil (Local Development)
        networks[31337] = NetworkConfig({
            name: "Anvil",
            poolManager: address(0), // Will be set during deployment
            weth9: address(0),
            hookPermissions: 0,
            isLocal: true
        });
        
        // Sepolia Testnet
        networks[11155111] = NetworkConfig({
            name: "Sepolia",
            poolManager: 0x8CF32B63ca23B8a5a48dA3c319e38E59B4Ca5dA0, // Replace with actual
            weth9: 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9, // Sepolia WETH
            hookPermissions: 1 << 5, // BEFORE_ADD_LIQUIDITY
            isLocal: false
        });
        
        // Base Mainnet
        networks[8453] = NetworkConfig({
            name: "Base",
            poolManager: 0x0000000000000000000000000000000000000000, // Replace with actual
            weth9: 0x4200000000000000000000000000000000000006, // Base WETH
            hookPermissions: 1 << 5,
            isLocal: false
        });
        
        // Base Sepolia
        networks[84532] = NetworkConfig({
            name: "Base Sepolia",
            poolManager: 0x0000000000000000000000000000000000000000, // Replace with actual
            weth9: 0x4200000000000000000000000000000000000006, // Base Sepolia WETH
            hookPermissions: 1 << 5,
            isLocal: false
        });
        
        // Ethereum Mainnet
        networks[1] = NetworkConfig({
            name: "Ethereum",
            poolManager: 0x0000000000000000000000000000000000000000, // Replace with actual
            weth9: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // Mainnet WETH
            hookPermissions: 1 << 5,
            isLocal: false
        });
    }
    
    /// @notice Main deployment function
    function run() public {
        uint256 chainId = block.chainid;
        
        // Validate network configuration
        require(bytes(networks[chainId].name).length > 0, "DeployAll: Network not configured");
        
        // Check if PoolManager is configured for non-local networks
        if (!networks[chainId].isLocal) {
            require(
                networks[chainId].poolManager != address(0),
                "DeployAll: PoolManager not configured for this network"
            );
        }
        
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("  GhostRoute Contract Deployment");
        console.log("========================================");
        console.log("");
        console.log("Network:", networks[chainId].name);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Deployer Balance:", deployer.balance);

        console.log("");
        
        // Check deployer balance
        require(deployer.balance > 0, "DeployAll: Deployer has no balance");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy MockZKVerifier
        console.log("[1/3] Deploying MockZKVerifier...");
        verifier = address(new MockZKVerifier());
        console.log("  -> MockZKVerifier:", verifier);
        
        // Step 2: Deploy PrivacyVault
        console.log("[2/3] Deploying PrivacyVault...");
        vault = address(new PrivacyVault(verifier));
        console.log("  -> PrivacyVault:", vault);
        
        // Optional: Fund vault for testing (local networks only)
        if (networks[chainId].isLocal) {
            (bool fundSuccess,) = address(vault).call{value: 10 ether}("");
            require(fundSuccess, "DeployAll: Failed to fund vault");
            console.log("  -> Vault funded with 10 ETH for testing");
        }
        
        // Step 3: Deploy PrivacyLiquidityHook (skip for local if no PoolManager)
        if (networks[chainId].poolManager != address(0)) {
            console.log("[3/3] Deploying PrivacyLiquidityHook...");
            // try {
                hook = address(new PrivacyLiquidityHook(
                    IPoolManager(networks[chainId].poolManager),
                    vault
                ));
                console.log("  -> PrivacyLiquidityHook:", hook);
                
                // Verify hook permissions
                uint160 hookAddress = uint160(hook);
                bool hasPermission = (hookAddress & networks[chainId].hookPermissions) != 0;
                
                if (hasPermission) {
                    console.log("  -> Hook has correct permissions: YES");
                } else {
                    console.log("  -> Hook has correct permissions: NO");
                    console.log("    (Use HookMiner to find valid salt for production)");
                }
            // } catch {
            //     console.log("  -> Hook deployment skipped (will deploy separately with HookMiner)");
            //     hook = address(0);
            // }
        } else {
            console.log("[3/3] Skipping PrivacyLiquidityHook (no PoolManager configured)");
            hook = address(0);
        }
        
        vm.stopBroadcast();
        
        // Save deployment addresses
        _saveDeployment(chainId);
        
        // Print summary
        _printSummary(chainId);
    }
    
    /// @notice Save deployment addresses to JSON file
    function _saveDeployment(uint256 chainId) internal {
        string memory deploymentsDir = "deployments";
        
        // Create directory if it doesn't exist
        vm.createDir(deploymentsDir, true);
        
        string memory filename = string.concat(
            deploymentsDir,
            "/",
            vm.toString(chainId),
            ".json"
        );
        
        // Build JSON manually since vm.serializeAddress has limitations
        string memory json = "{";
        
        // Add verifier
        json = string.concat(json, '"verifier":"', vm.toString(verifier), '"');
        json = string.concat(json, ",");
        
        // Add vault
        json = string.concat(json, '"vault":"', vm.toString(vault), '"');
        json = string.concat(json, ",");
        
        // Add hook (handle address(0))
        if (hook != address(0)) {
            json = string.concat(json, '"hook":"', vm.toString(hook), '"');
        } else {
            json = string.concat(json, '"hook":null');
        }
        json = string.concat(json, ",");
        
        // Add timestamp
        json = string.concat(json, '"timestamp":', vm.toString(block.timestamp));
        json = string.concat(json, ",");
        
        // Add chainId
        json = string.concat(json, '"chainId":', vm.toString(chainId));
        json = string.concat(json, ",");
        
        // Add network name
        json = string.concat(json, '"network":"', networks[chainId].name, '"');
        
        json = string.concat(json, "}");
        
        vm.writeJson(json, filename);
        console.log("\nDeployment saved to:", filename);
    }
    
    /// @notice Print deployment summary
    function _printSummary(uint256 chainId) internal view {
        console.log("");
        console.log("========================================");
        console.log("  Deployment Complete");
        console.log("========================================");
        console.log("");
        console.log("Network:", networks[chainId].name);
        console.log("Chain ID:", chainId);
        console.log("");
        console.log("Contracts:");
        console.log("  MockZKVerifier:      ", verifier);
        console.log("  PrivacyVault:        ", vault);
        
        if (hook != address(0)) {
            console.log("  PrivacyLiquidityHook:", hook);
        } else {
            console.log("  PrivacyLiquidityHook: (skipped)");
        }
        
        console.log("");
        console.log("========================================");
    }
}
