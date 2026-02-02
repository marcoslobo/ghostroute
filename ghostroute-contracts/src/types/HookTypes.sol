// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoolKey} from "v4-core/types/PoolKey.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title HookTypes
 * @notice Shared type definitions and data structures for the Privacy Hook Adapter
 * @dev Centralizes type definitions used across the hook implementation
 */
library HookTypes {
    
    /**
     * @notice Structure representing a privacy-preserving liquidity addition request
     * @param key The pool key identifying the target pool
     * @param params The liquidity modification parameters
     * @param proof The ZK-proof bytes validated by PrivacyVault
     * @param publicInputs The public inputs for proof verification
     */
    struct LiquidityRequest {
        PoolKey key;
        ModifyLiquidityParams params;
        bytes proof;
        bytes32[] publicInputs;
    }
    
    /**
     * @notice Structure representing the result of a liquidity addition
     * @param success Whether the operation succeeded
     * @param poolId The ID of the pool where liquidity was added
     * @param liquidityDelta The amount of liquidity added
     * @param actionHash The hash of the action parameters
     */
    struct LiquidityResult {
        bool success;
        bytes32 poolId;
        int128 liquidityDelta;
        bytes32 actionHash;
    }
    
    /**
     * @notice Authorization status values for transient storage
     */
    enum AuthorizationStatus {
        NONE,       // No authorization set
        PENDING,    // Authorization set but not yet validated
        AUTHORIZED  // Fully authorized and validated
    }
    
    /**
     * @notice Constant values used across the hook
     */
    uint24 constant FEE_TIER_LOW = 500;      // 0.05%
    uint24 constant FEE_TIER_MEDIUM = 3000;  // 0.3%
    uint24 constant FEE_TIER_HIGH = 10000;   // 1%
    
    /**
     * @notice Tick spacing constants for different fee tiers
     */
    int24 constant TICK_SPACING_LOW = 10;
    int24 constant TICK_SPACING_MEDIUM = 60;
    int24 constant TICK_SPACING_HIGH = 200;
    
    /**
     * @notice Gas limits for operations
     */
    uint256 constant GAS_LIMIT_LIQUIDITY_ADDITION = 200000; // Target <200k gas
}
