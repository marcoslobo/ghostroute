# PrivacyVault Data Model

## Core Entities

### PrivacyVault
**Purpose**: Main contract managing privacy deposits and Merkle Tree state

**Key Properties**:
- `tree`: LeanIMT instance for managing leaf commitments
- `nullifiers`: mapping(bytes32 => bool) for replay protection
- `nextLeafIndex`: uint256 for tracking tree position
- `owner`: address for administrative control

**State Transitions**:
- `Deposit`: Adds new leaf to Merkle Tree, marks nullifier
- `Withdraw`: Validates ZK proof, removes funds, updates tree

**Validation Rules**:
- Nullifier must be unused
- Merkle proof must be valid
- Permit2 signature must be valid
- Tree must not be at capacity

### Leaf (Commitment)
**Purpose**: Represents a privacy-preserving deposit commitment

**Key Properties**:
- `commitment`: bytes32 hash of deposit details
- `nullifier`: bytes32 unique identifier preventing double-spending
- `token`: address of deposited token (ETH = address(0))
- `amount`: uint256 deposit amount
- `salt`: bytes32 random value for privacy

**Validation Rules**:
- Commitment = H(nullifier, token, amount, salt)
- Nullifier must be unique across all deposits
- Amount must match transferred token amount

### MerkleTree (LeanIMT)
**Purpose**: Incremental Merkle Tree for deposit commitments

**Key Properties**:
- `height`: uint8 fixed at 20 (~1M leaves capacity)
- `root`: bytes32 current tree root
- `leaves`: bytes32[] array of commitments
- `zeros`: bytes32[] zero values for empty nodes

**State Transitions**:
- `insertLeaf`: Adds new commitment, updates root
- `verifyProof`: Validates membership proof

**Validation Rules**:
- Tree height must be exactly 20
- Cannot exceed maximum leaf count
- All proofs must verify against current root

### Permit2 Integration
**Purpose**: Unified token approval and transfer mechanism

**Key Properties**:
- `permit2`: IPermit2 interface constant
- `PERMIT2_ADDRESS`: address(0x000000000022D473030F116dDEE9F6B43aC78BA3)
- `WETH_ADDRESS`: address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)

**Validation Rules**:
- Signature must validate against permit data
- Permit expiration must be in future
- Token allowance must be sufficient
- ETH amounts must match msg.value

## Entity Relationships

```
PrivacyVault
├── contains → MerkleTree (1:1)
├── manages → Leaf[] (1:N)
├── validates → Permit2 (composition)
└── tracks → nullifiers (mapping)

Leaf
├── stored_in → MerkleTree
├── protected_by → nullifier
└── created_by → user_deposit

MerkleTree
├── stores → Leaf[]
├── provides → membership_proofs
└── maintains → root_hash
```

## Data Flow

### Deposit Flow
1. User creates deposit commitment off-chain
2. User signs Permit2 permit for token transfer
3. Contract validates Permit2 signature
4. Contract transfers tokens to vault
5. Contract validates nullifier uniqueness
6. Contract inserts leaf into Merkle Tree
7. Contract emits Deposit event

### Withdraw Flow (Future)
1. User generates ZK proof of ownership
2. User provides withdrawal proof and nullifier
3. Contract validates ZK proof
4. Contract validates nullifier not used
5. Contract transfers funds to user
6. Contract updates tree state
7. Contract emits Withdrawal event

## Privacy Considerations

### Zero-Knowledge Elements
- Commitments hide individual deposit amounts
- Nullifiers prevent double-spending without revealing source
- Merkle proofs allow anonymous withdrawal
- Off-chain computation preserves data sovereignty

### Linkability Prevention
- No on-chain connection between deposit tx and leaf position
- Random salts ensure commitment uniqueness
- Batch operations obscure transaction patterns
- Permit2 signatures don't reveal user intent

## Gas Optimization Considerations

### Storage Patterns
- Packed structs for efficient storage
- Minimal state variables in main contract
- Libraries for complex computations
- Event-based logging over storage

### Computation Patterns
- Incremental tree updates (O(log n) vs O(n))
- Pre-computed constants for hash functions
- Minimal validation loops
- Efficient proof verification