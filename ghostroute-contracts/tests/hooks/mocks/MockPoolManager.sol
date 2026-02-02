// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";

/**
 * @title MockPoolManager
 * @notice Simplified mock PoolManager for testing hooks
 */
contract MockPoolManager {
    
    struct Pool {
        bool initialized;
        uint160 sqrtPriceX96;
        int24 tick;
        uint24 fee;
    }
    
    struct Position {
        int256 liquidity;
    }
    
    mapping(bytes32 => Pool) public pools;
    mapping(bytes32 => mapping(bytes32 => Position)) public positions;
    
    event PoolInitialized(bytes32 indexed poolId, uint160 sqrtPriceX96, int24 tick);
    event LiquidityModified(
        bytes32 indexed poolId,
        address indexed owner,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta
    );
    
    error PoolAlreadyInitialized();
    error PoolNotInitialized();
    error InvalidTickRange();
    
    function initialize(PoolKey memory key, uint160 sqrtPriceX96) external returns (int24 tick) {
        bytes32 poolId = keccak256(abi.encode(key));
        
        if (pools[poolId].initialized) {
            revert PoolAlreadyInitialized();
        }
        
        tick = int24(int256(uint256(sqrtPriceX96)) / 1e6);
        
        pools[poolId] = Pool({
            initialized: true,
            sqrtPriceX96: sqrtPriceX96,
            tick: tick,
            fee: key.fee
        });
        
        emit PoolInitialized(poolId, sqrtPriceX96, tick);
        
        return tick;
    }
    
    function modifyLiquidity(
        PoolKey memory key,
        ModifyLiquidityParams memory params,
        bytes calldata hookData
    ) external returns (BalanceDelta delta, BalanceDelta feesAccrued) {
        bytes32 poolId = keccak256(abi.encode(key));
        
        if (!pools[poolId].initialized) {
            revert PoolNotInitialized();
        }
        
        if (params.tickLower >= params.tickUpper) {
            revert InvalidTickRange();
        }
        
        // Call hook if it has the beforeAddLiquidity callback
        if (address(key.hooks) != address(0)) {
            try IHooks(key.hooks).beforeAddLiquidity(msg.sender, key, params, hookData) returns (bytes4 selector) {
                // Validate selector
                if (selector != IHooks.beforeAddLiquidity.selector) {
                    revert("Invalid hook selector");
                }
            } catch {
                revert("Hook validation failed");
            }
        }
        
        // Update position
        bytes32 positionKey = keccak256(abi.encode(msg.sender, params.tickLower, params.tickUpper));
        positions[poolId][positionKey].liquidity += params.liquidityDelta;
        
        emit LiquidityModified(poolId, msg.sender, params.tickLower, params.tickUpper, params.liquidityDelta);
        
        return (BalanceDelta.wrap(params.liquidityDelta), BalanceDelta.wrap(0));
    }
    
    function getPositionLiquidity(bytes32 poolId, bytes32 positionKey) external view returns (int256) {
        return positions[poolId][positionKey].liquidity;
    }
}
