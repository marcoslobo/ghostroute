// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";

/**
 * @title IPrivacyLiquidityHook
 * @notice Interface for the Uniswap v4 Privacy Hook Adapter
 * @dev This hook enables privacy-preserving liquidity addition to Uniswap v4 pools
 *      using ZK-proof validation from the PrivacyVault
 */
interface IPrivacyLiquidityHook is IHooks {
    
    /**
     * @notice Error thrown when authorization via transient storage is invalid or missing
     */
    error UnauthorizedLiquidityAddition();
    
    /**
     * @notice Error thrown when the caller is not the authorized PrivacyVault
     */
    error OnlyPrivacyVault();
    
    /**
     * @notice Error thrown when the caller is not the PoolManager
     */
    error OnlyPoolManager();
    
    /**
     * @notice Error thrown when pool parameters are invalid
     */
    error InvalidPoolParameters();
    
    /**
     * @notice Error thrown when liquidity delta is not positive (adding liquidity)
     */
    error InvalidLiquidityDelta();
    
    /**
     * @notice Emitted when privacy-preserving liquidity is successfully added
     * @param poolId The ID of the pool where liquidity was added
     * @param recipient The address receiving the liquidity position
     * @param liquidityDelta The amount of liquidity added
     * @param actionHash The hash of the action parameters (for ZK-proof verification)
     */
    event PrivacyLiquidityAdded(
        bytes32 indexed poolId,
        address indexed recipient,
        int128 liquidityDelta,
        bytes32 actionHash
    );
    
    /**
     * @notice Computes the action hash for ZK-proof verification
     * @dev This hash must match the public inputs used in the Noir circuit
     * @param key The pool key identifying the Uniswap v4 pool
     * @param params The parameters for modifying liquidity
     * @param recipient The address that will receive the liquidity position
     * @return actionHash The computed keccak256 hash of all parameters
     */
    function computeActionHash(
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        address recipient
    ) external pure returns (bytes32 actionHash);
    
    /**
     * @notice Entry point for adding liquidity with privacy preservation
     * @dev Must be called by the PrivacyVault after ZK-proof validation
     * @param key The pool key for the target Uniswap v4 pool
     * @param params The liquidity modification parameters
     * @param proof The ZK-proof bytes (validated by PrivacyVault)
     * @param publicInputs The public inputs for proof verification
     */
    function addLiquidityWithPrivacy(
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external;
    
    /**
     * @notice Hook callback called before liquidity is added
     * @dev Validates that the operation was authorized via transient storage
     * @param sender The address initiating the liquidity addition
     * @param key The pool key
     * @param params The liquidity modification parameters
     * @param hookData Additional data passed to the hook
     * @return The function selector to confirm callback execution
     */
    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external returns (bytes4);
    
    /**
     * @notice Returns the PoolManager address
     * @return The IPoolManager interface reference
     */
    function poolManager() external view returns (IPoolManager);
    
    /**
     * @notice Returns the authorized PrivacyVault address
     * @return The address of the PrivacyVault that can initiate liquidity additions
     */
    function PRIVACY_VAULT() external view returns (address);
}
