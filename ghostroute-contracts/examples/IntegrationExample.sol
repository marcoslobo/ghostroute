// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

import {PrivacyLiquidityHook} from "../src/hooks/PrivacyLiquidityHook.sol";
import {IPrivacyVault} from "../src/hooks/interfaces/IPrivacyVault.sol";

/**
 * @title IntegrationExample
 * @notice Example demonstrating how to integrate PrivacyLiquidityHook with a PrivacyVault
 * 
 * This example shows:
 * 1. Deploying the PrivacyLiquidityHook with correct permissions
 * 2. Computing actionHash for ZK-proof generation
 * 3. Adding liquidity through the privacy-preserving flow
 * 
 * Usage flow:
 * 1. User generates ZK-proof of ownership in PrivacyVault
 * 2. PrivacyVault calls addLiquidityWithPrivacy() with proof
 * 3. Hook validates proof via transient storage
 * 4. Liquidity is added to the Uniswap v4 pool
 */
contract IntegrationExample {
    
    PrivacyLiquidityHook public hook;
    IPrivacyVault public privacyVault;
    IPoolManager public poolManager;
    
    address public constant TOKEN_A = address(0x1);
    address public constant TOKEN_B = address(0x2);
    
    /**
     * @notice Initialize the integration with hook and vault addresses
     */
    function initialize(
        IPoolManager _poolManager,
        IPrivacyVault _privacyVault
    ) external {
        poolManager = _poolManager;
        privacyVault = _privacyVault;
        
        // Deploy hook with PoolManager and PrivacyVault addresses
        hook = new PrivacyLiquidityHook(_poolManager, address(_privacyVault));
    }
    
    /**
     * @notice Example: Prepare liquidity addition parameters
     * @dev In practice, these would come from user input
     * @param tickLower Lower tick boundary
     * @param tickUpper Upper tick boundary
     * @param liquidityDelta Amount of liquidity to add
     * @param salt Unique salt for position differentiation
     */
    function prepareLiquidityParams(
        int24 tickLower,
        int24 tickUpper,
        uint256 liquidityDelta,
        bytes32 salt
    ) external pure returns (ModifyLiquidityParams memory params) {
        return ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: int256(liquidityDelta),
            salt: salt
        });
    }
    
    /**
     * @notice Example: Compute actionHash for ZK-proof generation
     * @dev This hash must match the public inputs used in the Noir circuit
     * @param key The pool key
     * @param params The liquidity parameters
     * @return actionHash The hash to include in ZK-proof public inputs
     */
    function computeActionHashForProof(
        PoolKey memory key,
        ModifyLiquidityParams memory params
    ) external view returns (bytes32 actionHash) {
        return hook.computeActionHash(key, params, address(privacyVault));
    }
    
    /**
     * @notice Example: Create pool key for a token pair
     * @dev Tokens must be ordered (currency0 < currency1)
     * @param token0 First token address
     * @param token1 Second token address  
     * @param fee Pool fee (e.g., 3000 for 0.3%)
     * @param tickSpacing Tick spacing for the pool
     * @return key The configured pool key
     */
    function createPoolKey(
        address token0,
        address token1,
        uint24 fee,
        int24 tickSpacing
    ) external pure returns (PoolKey memory key) {
        // Ensure correct token ordering (required by Uniswap v4)
        address currency0 = token0 < token1 ? token0 : token1;
        address currency1 = token0 < token1 ? token1 : token0;
        
        return PoolKey({
            currency0: Currency.wrap(currency0),
            currency1: Currency.wrap(currency1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(address(0)) // Will be updated after hook deployment
        });
    }
    
    /**
     * @notice Get hook address for pool creation
     * @return The deployed hook address
     */
    function getHookAddress() external view returns (address) {
        return address(hook);
    }
    
    /**
     * @notice Get hook permissions for verification
     * @return permissions The Hooks.Permissions struct
     */
    function getHookPermissions() external pure returns (Hooks.Permissions memory permissions) {
        return PrivacyLiquidityHook(address(0)).getHookPermissions();
    }
    
    /**
     * @notice Compute pool ID from pool key
     * @param key The pool key
     * @return poolId The unique pool identifier
     */
    function getPoolId(PoolKey memory key) external pure returns (bytes32 poolId) {
        return keccak256(abi.encode(key.currency0, key.currency1, key.fee, key.tickSpacing));
    }
}

/**
 * @title PrivacyVaultIntegrationMock
 * @notice Mock demonstrating the PrivacyVault side of integration
 * 
 * In a real implementation, this would:
 * 1. Verify ZK-proofs from users
 * 2. Set transient storage authorization
 * 3. Call addLiquidityWithPrivacy on the hook
 */
contract PrivacyVaultIntegrationMock {
    
    PrivacyLiquidityHook public hook;
    
    /**
     * @notice Simulate adding liquidity through privacy-preserving flow
     * @dev In production, this would verify ZK-proofs first
     */
    function addLiquidityWithPrivacy(
        PoolKey memory key,
        ModifyLiquidityParams memory params,
        bytes memory proof,
        bytes32[] memory publicInputs
    ) external {
        // In production: Verify ZK-proof here
        
        // Call the hook
        hook.addLiquidityWithPrivacy(key, params, proof, publicInputs);
    }
}
