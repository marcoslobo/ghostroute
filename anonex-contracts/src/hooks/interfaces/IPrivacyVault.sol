// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPrivacyVault
 * @notice Interface for the PrivacyVault that validates ZK-proofs and initiates actions
 * @dev The PrivacyVault is responsible for:
 *      1. Validating ZK-proofs that users own funds in the Merkle tree
 *      2. Setting transient storage authorization
 *      3. Calling the hook to execute privacy-preserving actions
 */
interface IPrivacyVault {
    
    /**
     * @notice Emitted when a privacy-preserving action is executed
     * @param actionHash The hash of the action that was executed
     * @param executor The address that initiated the action
     * @param success Whether the action succeeded
     */
    event ActionExecuted(
        bytes32 indexed actionHash,
        address indexed executor,
        bool success
    );
    
    /**
     * @notice Error thrown when ZK-proof validation fails
     */
    error InvalidProof();
    
    /**
     * @notice Error thrown when the action hash doesn't match expected value
     */
    error InvalidActionHash();
    
    /**
     * @notice Error thrown when the action execution fails
     */
    error ActionExecutionFailed();
    
    /**
     * @notice Executes a privacy-preserving action after validating ZK-proof
     * @param actionHash The hash of the action to execute
     * @param proof The ZK-proof bytes proving ownership of funds
     * @param data Encoded action data (e.g., PoolKey, ModifyLiquidityParams, recipient)
     * @return success True if the action was executed successfully
     * @dev This function:
     *      1. Validates the ZK-proof
     *      2. Sets transient storage authorization
     *      3. Decodes the action data
     *      4. Calls the appropriate hook/adapter
     */
    function executeAction(
        bytes32 actionHash,
        bytes calldata proof,
        bytes calldata data
    ) external returns (bool success);
    
    /**
     * @notice Validates a ZK-proof without executing an action
     * @param actionHash The hash of the action
     * @param proof The ZK-proof bytes
     * @param publicInputs The public inputs for the proof
     * @return isValid True if the proof is valid
     */
    function validateProof(
        bytes32 actionHash,
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool isValid);
    
    /**
     * @notice Gets the Merkle root of the privacy pool
     * @return merkleRoot The current Merkle root
     */
    function getMerkleRoot() external view returns (bytes32 merkleRoot);
    
    /**
     * @notice Checks if an action has been executed (nullifier check)
     * @param actionHash The hash of the action
     * @return isExecuted True if the action has already been executed
     */
    function isActionExecuted(bytes32 actionHash) external view returns (bool isExecuted);
}
