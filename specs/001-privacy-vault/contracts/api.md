# PrivacyVault Contract API Specification

## Core Contract Interface

### PrivacyVault.sol

#### State Variables

```solidity
// Merkle Tree Management
LeanIMT private tree;
uint256 private nextLeafIndex;
uint256 private constant MAX_LEAVES = 2**20;

// Privacy Protection
mapping(bytes32 => bool) private nullifiers;
mapping(bytes32 => bool) private usedCommitments;

// Contract Configuration
address private immutable owner;
IPermit2 private constant PERMIT2 = IPermit2(0x000000000022D473030F116dDEE9F6B43aC78BA3);
IWETH private constant WETH = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

// Gas Optimization
bytes32[] private zeroHashes;
```

#### Core Functions

##### depositWithPermit
```solidity
function depositWithPermit(
    address token,
    uint256 amount,
    bytes32 commitment,
    bytes32 nullifier,
    IPermit2.PermitSingle memory permit,
    bytes calldata signature
) external payable returns (uint256 leafIndex)
```

**Purpose**: Deposit ETH or ERC20 tokens with Permit2 approval
**Parameters**:
- `token`: Token address (address(0) for ETH)
- `amount`: Deposit amount
- `commitment`: H(nullifier, token, amount, salt)
- `nullifier`: Unique identifier preventing double-spend
- `permit`: Permit2 approval data
- `signature`: User signature for permit

**Returns**: `leafIndex` - Position in Merkle Tree

**Validation**:
- `require(!nullifiers[nullifier], "Nullifier already used")`
- `require(commitment != bytes32(0), "Invalid commitment")`
- `require(nextLeafIndex < MAX_LEAVES, "Tree at capacity")`
- `require(verifyPermitSignature(permit, signature), "Invalid permit signature")`

**Gas Optimization**: Target < 100k gas for successful deposit

##### getMerkleRoot
```solidity
function getMerkleRoot() external view returns (bytes32)
```

**Purpose**: Get current Merkle tree root
**Returns**: Current tree root for ZK proof verification

##### verifyMerkleProof
```solidity
function verifyMerkleProof(
    bytes32 leaf,
    bytes32[] calldata proof,
    uint256 leafIndex
) external view returns (bool)
```

**Purpose**: Verify Merkle membership proof
**Parameters**:
- `leaf`: Commitment to verify
- `proof`: Merkle proof array
- `leafIndex`: Position in tree

**Returns**: Boolean proof validity

##### getTreeInfo
```solidity
function getTreeInfo() external view returns (
    bytes32 root,
    uint256 leafCount,
    uint256 maxLeaves,
    uint8 height
)
```

**Purpose**: Get comprehensive tree information
**Returns**: Current root, leaf count, max capacity, tree height

#### View Functions

##### leafExists
```solidity
function leafExists(bytes32 commitment) external view returns (bool)
```

##### isNullifierUsed
```solidity
function isNullifierUsed(bytes32 nullifier) external view returns (bool)
```

##### getLeafCount
```solidity
function getLeafCount() external view returns (uint256)
```

#### Events

```solidity
event Deposit(
    bytes32 indexed commitment,
    bytes32 indexed nullifier,
    address indexed token,
    uint256 amount,
    uint256 leafIndex,
    bytes32 newRoot
);

event MerkleRootUpdated(
    bytes32 indexed oldRoot,
    bytes32 indexed newRoot,
    uint256 leafCount
);
```

#### Errors

```solidity
error NullifierAlreadyUsed(bytes32 nullifier);
error InvalidCommitment();
error TreeAtCapacity();
error InvalidPermitSignature();
error InsufficientAllowance();
error InvalidTokenAmount();
error ZeroAddress();
```

## Supporting Interfaces

### IPrivacyVault.sol
```solidity
interface IPrivacyVault {
    function depositWithPermit(
        address token,
        uint256 amount,
        bytes32 commitment,
        bytes32 nullifier,
        IPermit2.PermitSingle memory permit,
        bytes calldata signature
    ) external payable returns (uint256 leafIndex);
    
    function getMerkleRoot() external view returns (bytes32);
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external view returns (bool);
    
    function getTreeInfo() external view returns (
        bytes32 root,
        uint256 leafCount,
        uint256 maxLeaves,
        uint8 height
    );
}
```

### IMerkleTree.sol
```solidity
interface IMerkleTree {
    function insert(bytes32 leaf) external returns (uint256 index);
    function root() external view returns (bytes32);
    function verify(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 index
    ) external view returns (bool);
    function leafCount() external view returns (uint256);
}
```

## Gas Optimization Specifications

### Target Gas Costs
- `depositWithPermit`: < 100,000 gas
- `getMerkleRoot`: ~2,000 gas (view)
- `verifyMerkleProof`: ~5,000 gas (view)

### Optimization Strategies
- Use packed structs for storage efficiency
- Pre-compute zero hashes for tree initialization
- Minimize external calls during deposit
- Use efficient hash function (Poseidon)
- Optimize proof verification algorithm

## Security Requirements

### Constitutional Compliance
- ✅ Privacy by Default: No on-chain linkability
- ✅ Economic Integrity: Atomic transaction handling
- ✅ Security Testing: 100% branch coverage
- ✅ Formal Verification Ready: Clear, auditable code

### Attack Vector Protection
- Replay attack protection via nullifiers
- Frontrunning protection via commitment pre-marking
- Reentrancy protection via nonReentrant modifier
- Integer overflow protection via Solidity 0.8+
- Access control via role-based permissions

## Integration Points

### Permit2 Integration
- Support for ETH and ERC20 unified interface
- Batch operations for gas optimization
- Signature validation and expiration handling
- Allowance management and transfer execution

### Future ZK Integration
- Merkle proof verification for withdrawals
- Nullifier validation for double-spend prevention
- Commitment validation for deposit privacy
- Tree state management for anonymous operations