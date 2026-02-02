// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/utils/BaseHook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {Hooks} from "v4-core/libraries/Hooks.sol";
import {ModifyLiquidityParams} from "v4-core/types/PoolOperation.sol";
import {TransientStorage} from "../libraries/TransientStorage.sol";
import {ActionHash} from "../libraries/ActionHash.sol";
import {IPrivacyVault} from "./interfaces/IPrivacyVault.sol";

/**
 * @title PrivacyLiquidityHook
 * @notice Uniswap v4 Hook for privacy-preserving liquidity addition
 * @dev This hook enables users to add liquidity to Uniswap v4 pools using funds
 *      from the PrivacyVault without revealing the source of funds. It uses
 *      EIP-1153 transient storage to verify ZK-proof validation within the same
 *      transaction.
 *
 *      Key features:
 *      - Inherits from BaseHook for standard Uniswap v4 hook behavior
 *      - Uses transient storage for authorization (no persistent state)
 *      - Computes actionHash aligned with Noir circuit public inputs
 *      - Handles atomic asset settlement from Vault to PoolManager
 */
contract PrivacyLiquidityHook is BaseHook {
    
    using TransientStorage for bytes32;
    using ActionHash for PoolKey;
    using ActionHash for ModifyLiquidityParams;
    
    // ============ Errors ============
    
    /// @notice Error thrown when authorization via transient storage is invalid or missing
    error UnauthorizedLiquidityAddition();
    
    /// @notice Error thrown when the caller is not the authorized PrivacyVault
    error OnlyPrivacyVault();
    
    /// @notice Error thrown when the caller is not the PoolManager
    error OnlyPoolManager();
    
    /// @notice Error thrown when pool parameters are invalid
    error InvalidPoolParameters();
    
    /// @notice Error thrown when liquidity delta is not positive (adding liquidity)
    error InvalidLiquidityDelta();
    
    /// @notice Error thrown when the PrivacyVault call fails
    error VaultCallFailed();
    
    // ============ Events ============
    
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
        int256 liquidityDelta,
        bytes32 actionHash
    );
    
    /**
     * @notice Emitted when authorization is validated via transient storage
     * @param authorizedAddress The address that was authorized
     * @param success Whether authorization was successful
     */
    event AuthorizationValidated(
        address indexed authorizedAddress,
        bool success
    );
    
    // ============ State Variables ============
    
    /// @notice The authorized PrivacyVault address that can initiate liquidity additions
    address public immutable PRIVACY_VAULT;
    
    /// @notice The transient storage slot for authorization (inherited from TransientStorage)
    bytes32 private constant AUTHORIZATION_SLOT = TransientStorage.AUTHORIZATION_SLOT;
    
    // ============ Modifiers ============
    
    /**
     * @notice Ensures the caller is the authorized PrivacyVault
     */
    modifier onlyPrivacyVault() {
        if (msg.sender != PRIVACY_VAULT) {
            revert OnlyPrivacyVault();
        }
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the hook with PoolManager and PrivacyVault addresses
     * @param _poolManager The Uniswap v4 PoolManager contract
     * @param _privacyVault The PrivacyVault contract that validates ZK-proofs
     */
    constructor(
        IPoolManager _poolManager,
        address _privacyVault
    ) BaseHook(_poolManager) {
        require(_privacyVault != address(0), "Invalid PrivacyVault address");
        PRIVACY_VAULT = _privacyVault;
    }
    
    // ============ Hook Permissions ============
    
    /**
     * @notice Returns the hook permissions required for this contract
     * @return permissions The Hooks.Permissions struct with callback flags
     * @dev This hook only needs beforeAddLiquidity to validate authorization
     */
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,  // Required for authorization validation
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
    
    // ============ Public Functions ============
    
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
        ModifyLiquidityParams calldata params,
        address recipient
    ) external pure returns (bytes32 actionHash) {
        return ActionHash.computeLiquidityActionHash(key, params, recipient);
    }
    
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
        ModifyLiquidityParams calldata params,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external onlyPrivacyVault {
        // Validate pool parameters
        if (!_validatePoolParameters(key, params)) {
            revert InvalidPoolParameters();
        }
        
        // Ensure liquidity delta is positive (adding liquidity)
        if (params.liquidityDelta <= 0) {
            revert InvalidLiquidityDelta();
        }
        
        // Compute action hash
        bytes32 actionHash = ActionHash.computeLiquidityActionHash(key, params, PRIVACY_VAULT);
        
        // Call PoolManager to add liquidity
        // The beforeAddLiquidity hook will validate transient storage authorization
        // Note: poolManager is inherited from BaseHook as IPoolManager immutable
        (BalanceDelta delta, BalanceDelta feesAccrued) = IPoolManager(address(poolManager)).modifyLiquidity(
            key,
            params,
            "" // No additional hook data needed
        );
        
        // Emit success event
        bytes32 poolId = ActionHash.getPoolId(key);
        emit PrivacyLiquidityAdded(
            poolId,
            PRIVACY_VAULT,
            params.liquidityDelta,
            actionHash
        );
    }
    
    /**
     * @notice Returns the PoolManager address
     * @return The IPoolManager interface reference
     */
    function getPoolManager() external view returns (IPoolManager) {
        return IPoolManager(address(poolManager));
    }
    
    // ============ Hook Callbacks ============
    
    /**
     * @notice Hook callback called before liquidity is added
     * @dev Validates that the operation was authorized via transient storage
     * @param sender The address initiating the liquidity addition
     * @param key The pool key
     * @param params The liquidity modification parameters
     * @param hookData Additional data passed to the hook (unused)
     * @return selector The function selector to confirm callback execution
     */
    function _beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4 selector) {
        // Validate authorization via transient storage
        if (!_validateAuthorization()) {
            revert UnauthorizedLiquidityAddition();
        }
        
        // Emit authorization validation event
        emit AuthorizationValidated(PRIVACY_VAULT, true);
        
        return this.beforeAddLiquidity.selector;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Validates authorization via transient storage
     * @return isAuthorized True if the PrivacyVault is authorized
     * @dev Reads from EIP-1153 transient storage to verify authorization was set
     *      by the PrivacyVault in the same transaction
     */
    function _validateAuthorization() internal view virtual returns (bool isAuthorized) {
        address authorized = TransientStorage.getAuthorization();
        return authorized == PRIVACY_VAULT;
    }
    
    /**
     * @notice Validates pool and liquidity parameters
     * @param key The pool key to validate
     * @param params The liquidity parameters to validate
     * @return isValid True if all parameters are valid
     */
    function _validatePoolParameters(
        PoolKey calldata key,
        ModifyLiquidityParams calldata params
    ) internal pure returns (bool isValid) {
        // Check currency ordering
        if (uint160(Currency.unwrap(key.currency0)) >= uint160(Currency.unwrap(key.currency1))) {
            return false;
        }
        
        // Check fee is valid
        if (key.fee > 1000000) {
            return false;
        }
        
        // Check tick spacing
        if (key.tickSpacing <= 0) {
            return false;
        }
        
        // Check tick bounds
        if (params.tickLower >= params.tickUpper) {
            return false;
        }
        
        // Check ticks are multiples of tick spacing
        if (params.tickLower % key.tickSpacing != 0 || params.tickUpper % key.tickSpacing != 0) {
            return false;
        }
        
        return true;
    }
}
