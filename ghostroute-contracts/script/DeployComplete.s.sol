// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PrivacyVault} from "../PrivacyVault.sol";
import {MockZKVerifier} from "../mocks/MockZKVerifier.sol";
import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/// @title DeployComplete
/// @notice Complete deployment script for GhostRoute contracts
/// @dev Deploys all contracts in correct order with proper integration
contract DeployComplete is Script {
    
    /// @notice Network configurations
    struct NetworkConfig {
        string name;
        address poolManager;
        address weth9;
        bool isLocal;
    }
    
    /// @notice Deployment results
    struct DeploymentResult {
        address verifier;
        address vault;
        address hook;
        uint256 chainId;
        uint256 timestamp;
    }
    
    /// @notice Salt for CREATE2 deployment
    bytes32 constant CREATE2_SALT = bytes32(uint256(3)); // Valid salt found by miner
    
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
            isLocal: true
        });
        
        // Sepolia Testnet
        networks[11155111] = NetworkConfig({
            name: "Sepolia",
            poolManager: 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543, // Sepolia PoolManager
            weth9: 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9, // Sepolia WETH
            isLocal: false
        });
    }
    
    /// @notice Main deployment function
    function run() public {
        uint256 chainId = block.chainid;
        
        // Validate network configuration
        require(bytes(networks[chainId].name).length > 0, "DeployComplete: Network not configured");
        
        // Check if PoolManager is configured for non-local networks
        if (!networks[chainId].isLocal) {
            require(
                networks[chainId].poolManager != address(0),
                "DeployComplete: PoolManager not configured for this network"
            );
        }
        
        // Load private key from environment or use default for Anvil
        uint256 deployerPrivateKey;
        if (block.chainid == 31337) {
            // Default Anvil private key
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff807;
        } else {
            deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        }
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("  GhostRoute Complete Deployment");
        console.log("========================================");
        console.log("");
        console.log("Network:", networks[chainId].name);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Deployer Balance:", deployer.balance);
        console.log("");
        
        // Check deployer balance
        require(deployer.balance > 0, "DeployComplete: Deployer has no balance");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy MockZKVerifier
        console.log("[1/4] Deploying MockZKVerifier...");
        verifier = address(new MockZKVerifier());
        console.log("  -> MockZKVerifier:", verifier);
        
        // Step 2: Deploy PrivacyLiquidityHook with CREATE2
        console.log("[2/4] Deploying PrivacyLiquidityHook with CREATE2...");
        
        if (networks[chainId].isLocal) {
            // For local deployment, use regular create
            hook = address(new PrivacyLiquidityHook(
                IPoolManager(networks[chainId].poolManager),
                address(0) // Will update after vault deployment
            ));
        } else {
            // For production, use CREATE2 with valid salt
            hook = address(new PrivacyLiquidityHook{salt: CREATE2_SALT}(
                IPoolManager(networks[chainId].poolManager),
                address(0) // Will update after vault deployment
            ));
        }
        
        console.log("  -> PrivacyLiquidityHook:", hook);
        
        // Verify hook permissions
        uint160 hookAddress = uint160(hook);
        bool hasPermission = (hookAddress & (1 << 11)) != 0; // BEFORE_ADD_LIQUIDITY_FLAG
        console.log("  -> Has BEFORE_ADD_LIQUIDITY permission:", hasPermission);
        
        if (!hasPermission) {
            console.log("  -> WARNING: Hook does not have required permissions!");
        }
        
        // Step 3: Deploy PrivacyVault with hook address
        console.log("[3/4] Deploying PrivacyVault...");
        vault = address(new PrivacyVault(verifier, hook));
        console.log("  -> PrivacyVault:", vault);
        
        // Step 4: Update hook with vault address
        console.log("[4/4] Updating PrivacyLiquidityHook with vault address...");
        
        // For now, we need to redeploy the hook with correct vault address
        // In production, you would implement a setter function
        if (networks[chainId].isLocal) {
            // Redeploy hook with correct vault address for local testing
            hook = address(new PrivacyLiquidityHook(
                IPoolManager(networks[chainId].poolManager),
                vault
            ));
            console.log("  -> Redeployed PrivacyLiquidityHook:", hook);
        } else {
            // For production, you need to implement a setter or deploy in two phases
            console.log("  -> Hook deployed with placeholder. Implement setter or two-phase deploy.");
            console.log("  -> Deploying final PrivacyLiquidityHook with correct vault...");
            
            hook = address(new PrivacyLiquidityHook{salt: CREATE2_SALT}(
                IPoolManager(networks[chainId].poolManager),
                vault
            ));
            console.log("  -> Final PrivacyLiquidityHook:", hook);
        }
        
        vm.stopBroadcast();
        
        // Save deployment addresses
        _saveDeployment(chainId);
        
        // Print summary
        _printSummary(chainId);
        
        // Test integration
        _testIntegration();
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
        
        // Build JSON manually
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
            console.log("  PrivacyLiquidityHook: (failed)");
        }
        
        console.log("");
        console.log("NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=", vm.toString(vault));
        console.log("NEXT_PUBLIC_PRIVACY_HOOK_ADDRESS=", vm.toString(hook));
        console.log("========================================");
    }
    
    /// @notice Test basic integration
    function _testIntegration() internal view {
        console.log("\n=== Testing Integration ===");
        
        if (vault != address(0) && hook != address(0)) {
            console.log("All contracts deployed successfully");
            
            // Test basic calls
            try IPoolManager(address(hook)).getPoolManager()() returns (address pm) {
                console.log("PoolManager accessible from hook:", pm);
            } catch {
                console.log("Failed to access PoolManager from hook");
            }
            
            console.log("Ready for Uniswap V4 integration");
        } else {
            console.log("Deployment incomplete - missing contracts");
        }
    }
    
    /// @notice Deploy only hook (for testing)
    function deployHookOnly() public {
        uint256 chainId = block.chainid;
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        hook = address(new PrivacyLiquidityHook{salt: CREATE2_SALT}(
            IPoolManager(networks[chainId].poolManager),
            address(0)
        ));
        
        vm.stopBroadcast();
        
        console.log("PrivacyLiquidityHook deployed:", hook);
        console.log("Use this address in PrivacyVault constructor");
    }
    
    /// @notice Deploy with existing hook
    function deployWithExistingHook(address _hook) public {
        uint256 chainId = block.chainid;
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        require(_hook != address(0), "Invalid hook address");
        
        vm.startBroadcast(deployerPrivateKey);
        
        verifier = address(new MockZKVerifier());
        vault = address(new PrivacyVault(verifier, _hook));
        
        vm.stopBroadcast();
        
        console.log("MockZKVerifier:", verifier);
        console.log("PrivacyVault:", vault);
        console.log("Using existing PrivacyLiquidityHook:", _hook);
    }
}