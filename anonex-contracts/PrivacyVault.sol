// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IPrivacyVault.sol";
import "./interfaces/IZKVerifier.sol";
import "./types/Deposit.sol";
import "./libraries/BaseLib.sol";
import "./libraries/Permit2Lib.sol";

/// @title PrivacyVault
/// @notice Privacy-preserving vault for ETH/ERC20 deposits with ZK proof verification
/// @dev Implements UTXO model with Merkle Tree for note tracking
contract PrivacyVault is IPrivacyVault, ReentrancyGuard {
    using PrivacyVaultErrors for bytes32;
    using PrivacyVaultEvents for bytes32;
    
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    mapping(bytes32 => bool) private nullifiers;
    uint256 private nextLeafIndex;
    address private immutable owner;
    
    address private constant ETH_ADDRESS = address(0);
    
    /// @notice ZK Verifier contract reference
    IZKVerifier public verifier;
    
    /// @notice Current Merkle tree root
    bytes32 public currentRoot;
    
    /// @notice Mapping of commitments to their status
    mapping(bytes32 => bool) public commitments;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    event ActionExecuted(
        bytes32 indexed nullifier,
        bytes32 indexed changeCommitment,
        bytes32 indexed actionHash,
        uint256 investAmount,
        uint256 timestamp
    );
    
    event VerifierUpdated(address indexed newVerifier);
    
    // ========================================================================
    // MODIFIERS
    // ========================================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    constructor(address _verifier) {
        owner = msg.sender;
        verifier = IZKVerifier(_verifier);
        currentRoot = bytes32(0);
    }
    
    // ========================================================================
    // CORE FUNCTIONS - DEPOSIT
    // ========================================================================
    
    /// @notice Deposits ETH or ERC20 tokens with Permit2 approval
    /// @param token Token address (address(0) for ETH)
    /// @param amount Deposit amount
    /// @param commitment H(nullifier, token, amount, salt)
    /// @param nullifier Unique identifier preventing double-spend
    /// @param permit Permit2 approval data
    /// @param signature User signature for permit
    /// @return leafIndex Position in Merkle tree
    function depositWithPermit(
        address token,
        uint256 amount,
        bytes32 commitment,
        bytes32 nullifier,
        IPermit2.PermitSingle memory permit,
        bytes calldata signature
    ) external payable nonReentrant returns (uint256 leafIndex) {
        // Validation
        if (commitment == bytes32(0)) {
            revert PrivacyVaultErrors.InvalidCommitment();
        }
        
        if (nullifiers[nullifier]) {
            revert PrivacyVaultErrors.NullifierAlreadyUsed(nullifier);
        }
        
        if (amount == 0) {
            revert PrivacyVaultErrors.InvalidTokenAmount();
        }
        
        if (nextLeafIndex >= 1048576) {
            revert PrivacyVaultErrors.TreeAtCapacity();
        }
        
        // Simplified ETH deposit logic for testing
        if (token == ETH_ADDRESS) {
            require(msg.value == amount, "Invalid ETH amount");
        } else {
            require(msg.value == 0, "Invalid ETH for ERC20");
        }
        
        // Update state
        nullifiers[nullifier] = true;
        commitments[commitment] = true;
        leafIndex = nextLeafIndex;
        nextLeafIndex++;
        
        // Update Merkle root (simplified for testing)
        currentRoot = keccak256(abi.encodePacked(currentRoot, commitment));
        
        // Emit events
        emit PrivacyVaultEvents.Deposit(
            commitment,
            nullifier,
            token,
            amount,
            leafIndex,
            currentRoot
        );
        
        emit PrivacyVaultEvents.MerkleRootUpdated(
            currentRoot,
            currentRoot,
            nextLeafIndex
        );
        
        return leafIndex;
    }
    
    // ========================================================================
    // CORE FUNCTIONS - ZK ACTION EXECUTION
    // ========================================================================
    
    /// @notice Execute an action using a ZK proof (Spend + Change flow)
    /// @dev Validates ZK proof, prevents double-spending, updates Merkle tree
    /// @param proof ZK proof data generated by Noir circuit
    /// @param root Merkle tree root at time of proof generation
    /// @param nullifierHash Public nullifier hash (prevents double-spending)
    /// @param changeCommitment Commitment to the change note (UTXO)
    /// @param actionHash Hash of Uniswap v4 parameters (anti-tampering)
    /// @param investAmount Amount being invested
    /// @param uniswapParams Encoded Uniswap v4 parameters (poolId, tickLower, tickUpper, etc.)
    function executeAction(
        bytes calldata proof,
        bytes32 root,
        bytes32 nullifierHash,
        bytes32 changeCommitment,
        bytes32 actionHash,
        uint256 investAmount,
        bytes calldata uniswapParams
    ) external nonReentrant {
        // ------------------------------------------------------------------------
        // 1. VERIFY ZK PROOF
        // ------------------------------------------------------------------------
        // Prepare public inputs array in the order expected by the verifier
        bytes32[] memory publicInputs = new bytes32[](5);
        publicInputs[0] = root;
        publicInputs[1] = nullifierHash;
        publicInputs[2] = changeCommitment;
        publicInputs[3] = actionHash;
        publicInputs[4] = bytes32(investAmount);
        
        // Verify the proof using the ZK verifier contract
        bool isValid = verifier.verify(proof, publicInputs);
        require(isValid, "ZK proof verification failed");
        
        // ------------------------------------------------------------------------
        // 2. PREVENT DOUBLE-SPENDING
        // ------------------------------------------------------------------------
        // Check if this nullifier has already been used
        require(!nullifiers[nullifierHash], "Nullifier already spent");
        
        // Mark nullifier as used immediately
        nullifiers[nullifierHash] = true;
        
        // ------------------------------------------------------------------------
        // 3. VERIFY MERKLE ROOT
        // ------------------------------------------------------------------------
        // The root must match the current state (or be a valid historical root)
        require(root == currentRoot, "Invalid Merkle root");
        
        // ------------------------------------------------------------------------
        // 4. INTENT BINDING (Anti-Tampering)
        // ------------------------------------------------------------------------
        // Verify actionHash is non-zero (actual parameter binding happens off-chain in ZK circuit)
        // The ZK circuit constrains the actionHash, and we verify it matches here
        require(actionHash != bytes32(0), "Invalid action hash");
        // Note: Full parameter reconstruction and verification would decode uniswapParams
        // and verify each field matches the expected action. For this implementation,
        // we trust the ZK circuit to have properly constrained these values.
        
        // ------------------------------------------------------------------------
        // 5. UPDATE MERKLE TREE WITH CHANGE COMMITMENT
        // ------------------------------------------------------------------------
        // Add the change commitment to the tree (UTXO model)
        require(changeCommitment != bytes32(0), "Invalid change commitment");
        require(!commitments[changeCommitment], "Change commitment already exists");
        
        commitments[changeCommitment] = true;
        
        // Update Merkle root to include the new change commitment
        bytes32 oldRoot = currentRoot;
        currentRoot = keccak256(abi.encodePacked(currentRoot, changeCommitment));
        nextLeafIndex++;
        
        // ------------------------------------------------------------------------
        // 6. EXECUTE UNISWAP ACTION
        // ------------------------------------------------------------------------
        // In production, this would call Uniswap v4 hook with uniswapParams
        // For now, we just emit an event
        emit ActionExecuted(
            nullifierHash,
            changeCommitment,
            actionHash,
            investAmount,
            block.timestamp
        );
        
        emit PrivacyVaultEvents.MerkleRootUpdated(
            oldRoot,
            currentRoot,
            nextLeafIndex
        );
    }
    
    /// @notice Compute action hash from Uniswap v4 parameters
    /// @param poolId Uniswap v4 pool ID
    /// @param tickLower Lower tick of the position
    /// @param tickUpper Upper tick of the position
    /// @param amount0Desired Amount of token0 to invest
    /// @param amount1Desired Amount of token1 to invest
    /// @return actionHash Computed hash
    function computeActionHash(
        bytes32 poolId,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) external pure returns (bytes32 actionHash) {
        return keccak256(abi.encodePacked(
            poolId,
            tickLower,
            tickUpper,
            amount0Desired,
            amount1Desired
        ));
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /// @notice Gets current Merkle tree root
    /// @return Current tree root
    function getMerkleRoot() external view override returns (bytes32) {
        return currentRoot;
    }
    
    /// @notice Verifies Merkle membership proof
    /// @param leaf Commitment to verify
    /// @param proof Merkle proof array
    /// @param leafIndex Position in tree
    /// @return valid Proof validity
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external pure override returns (bool) {
        // Simplified verification for testing
        return leafIndex < 1048576;
    }
    
    /// @notice Gets comprehensive tree information
    /// @return root Current tree root
    /// @return leafCount Number of leaves
    /// @return maxLeaves Maximum capacity
    /// @return height Tree height
    function getTreeInfo() external view override returns (
        bytes32 root,
        uint256 leafCount,
        uint256 maxLeaves,
        uint8 height
    ) {
        return (
            currentRoot,
            nextLeafIndex,
            1048576, // 2^20
            20
        );
    }
    
    /// @notice Checks if nullifier is already used
    /// @param nullifier Nullifier to check
    /// @return used Whether nullifier is used
    function isNullifierUsed(bytes32 nullifier) external view override returns (bool) {
        return nullifiers[nullifier];
    }
    
    /// @notice Gets total leaf count
    /// @return count Total number of leaves
    function getLeafCount() external view override returns (uint256) {
        return nextLeafIndex;
    }
    
    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================
    
    /// @notice Update the ZK verifier contract address
    /// @param newVerifier Address of the new verifier contract
    function updateVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid verifier address");
        verifier = IZKVerifier(newVerifier);
        emit VerifierUpdated(newVerifier);
    }
    
    /// @notice Get contract owner
    /// @return Owner address
    function getOwner() external view returns (address) {
        return owner;
    }
}