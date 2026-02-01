// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoolKey} from "v4-core/types/PoolKey.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";
import {Currency} from "v4-core/types/Currency.sol";

/**
 * @title ActionHash
 * @notice Library for computing action hashes that align with Noir circuit public inputs
 * @dev The action hash is used as a public input for ZK-proof verification.
 *      Both Solidity and Noir must use identical encoding to ensure compatibility.
 */
library ActionHash {
    
    /**
     * @notice Computes the action hash for privacy-preserving liquidity addition
     * @param key The pool key identifying the target Uniswap v4 pool
     * @param params The liquidity modification parameters
     * @param recipient The address that will receive the liquidity position
     * @return actionHash The keccak256 hash of all parameters
     * @dev Encoding order (must match Noir circuit):
     *      1. key.currency0 (address)
     *      2. key.currency1 (address)
     *      3. key.fee (uint24)
     *      4. key.tickSpacing (int24)
     *      5. params.tickLower (int24)
     *      6. params.tickUpper (int24)
     *      7. params.liquidityDelta (int128)
     *      8. params.salt (bytes32)
     *      9. recipient (address)
     */
    function computeLiquidityActionHash(
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        address recipient
    ) internal pure returns (bytes32 actionHash) {
        return keccak256(abi.encode(
            key.currency0,
            key.currency1,
            key.fee,
            key.tickSpacing,
            params.tickLower,
            params.tickUpper,
            params.liquidityDelta,
            params.salt,
            recipient
        ));
    }
    
    /**
     * @notice Computes action hash with memory params (for internal use)
     * @param key The pool key (memory)
     * @param params The liquidity params (memory)
     * @param recipient The recipient address
     * @return actionHash The computed hash
     */
    function computeLiquidityActionHashMemory(
        PoolKey memory key,
        ModifyLiquidityParams memory params,
        address recipient
    ) internal pure returns (bytes32 actionHash) {
        return keccak256(abi.encode(
            key.currency0,
            key.currency1,
            key.fee,
            key.tickSpacing,
            params.tickLower,
            params.tickUpper,
            params.liquidityDelta,
            params.salt,
            recipient
        ));
    }
    
    /**
     * @notice Validates that pool parameters are within acceptable ranges
     * @param key The pool key to validate
     * @param params The liquidity params to validate
     * @return isValid True if all parameters are valid
     * @dev Reverts with specific errors for invalid parameters
     */
    function validatePoolParameters(
        PoolKey calldata key,
        ModifyLiquidityParams calldata params
    ) internal pure returns (bool isValid) {
        // Check currency ordering (Uniswap requirement)
        require(
            uint160(Currency.unwrap(key.currency0)) < uint160(Currency.unwrap(key.currency1)),
            "Invalid currency order"
        );
        
        // Check fee is valid tier
        require(key.fee <= 1000000, "Invalid fee tier"); // Max 100%
        
        // Check tick spacing is positive
        require(key.tickSpacing > 0, "Invalid tick spacing");
        
        // Check tick bounds are valid
        require(params.tickLower < params.tickUpper, "Invalid tick range");
        require(
            params.tickLower % key.tickSpacing == 0,
            "tickLower not multiple of tickSpacing"
        );
        require(
            params.tickUpper % key.tickSpacing == 0,
            "tickUpper not multiple of tickSpacing"
        );
        
        // Check liquidity delta is positive (adding liquidity only)
        require(params.liquidityDelta > 0, "Invalid liquidity delta");
        
        return true;
    }
    
    /**
     * @notice Gets the pool ID from a PoolKey (calldata version)
     * @param key The pool key
     * @return poolId The unique identifier for the pool
     */
    function getPoolId(PoolKey calldata key) internal pure returns (bytes32 poolId) {
        return keccak256(abi.encode(key));
    }
    
    /**
     * @notice Gets the pool ID from a PoolKey (memory version)
     * @param key The pool key
     * @return poolId The unique identifier for the pool
     */
    function getPoolIdMemory(PoolKey memory key) internal pure returns (bytes32 poolId) {
        return keccak256(abi.encode(key));
    }
    
    /**
     * @notice Validates pool and liquidity parameters (memory version)
     * @param key The pool key to validate
     * @param params The liquidity params to validate
     * @return isValid True if all parameters are valid
     */
    function validatePoolParametersMemory(
        PoolKey memory key,
        ModifyLiquidityParams memory params
    ) internal pure returns (bool isValid) {
        // Check currency ordering (Uniswap requirement)
        require(
            uint160(Currency.unwrap(key.currency0)) < uint160(Currency.unwrap(key.currency1)),
            "Invalid currency order"
        );
        
        // Check fee is valid tier
        require(key.fee <= 1000000, "Invalid fee tier"); // Max 100%
        
        // Check tick spacing is positive
        require(key.tickSpacing > 0, "Invalid tick spacing");
        
        // Check tick bounds are valid
        require(params.tickLower < params.tickUpper, "Invalid tick range");
        require(
            params.tickLower % key.tickSpacing == 0,
            "tickLower not multiple of tickSpacing"
        );
        require(
            params.tickUpper % key.tickSpacing == 0,
            "tickUpper not multiple of tickSpacing"
        );
        
        // Check liquidity delta is positive (adding liquidity only)
        require(params.liquidityDelta > 0, "Invalid liquidity delta");
        
        return true;
    }
}
