# Data Model: ERC20 Deposit & Withdraw Support

**Feature**: `014-erc20-deposit-withdraw`  
**Date**: 2026-02-06

---

## Core Entities

### 1. PrivacyVault (Extended Contract)

The PrivacyVault contract is extended with ERC20 support. No new contracts are created — the existing contract gains new state variables and functions.

**New State Variables**:

| Variable | Type | Visibility | Description |
|----------|------|------------|-------------|
| `tokenBalances` | `mapping(address => uint256)` | `public` | Internal balance tracking per ERC20 token address. `address(0)` is NOT tracked (ETH uses `address(this).balance`). |
| `allowedTokens` | `mapping(address => bool)` | `public` | Token allowlist. Only tokens in this mapping can be deposited/withdrawn. Controlled by `owner`. |
| `PERMIT2` | `ISignatureTransfer` | `public immutable` | Permit2 SignatureTransfer contract reference. Set in constructor. |

**Existing State Variables (unchanged)**:

| Variable | Type | Description |
|----------|------|-------------|
| `nullifiers` | `mapping(bytes32 => bool)` | Tracks used nullifiers (shared by ETH and ERC20) |
| `nextLeafIndex` | `uint256` | Current Merkle tree leaf position |
| `owner` | `address immutable` | Contract owner |
| `verifier` | `IZKVerifier` | ZK proof verifier reference |
| `currentRoot` | `bytes32` | Current Merkle tree root |
| `commitments` | `mapping(bytes32 => bool)` | Tracks inserted commitments |

---

### 2. ERC20 Deposit Note

An ERC20 deposit creates a commitment in the unified Merkle tree. The commitment binds the token address.

**Fields** (private — known only to the depositor):

| Field | Type (Solidity) | Type (Circuit/Noir) | Description |
|-------|-----------------|---------------------|-------------|
| `nullifier` | `bytes32` | `Field` | Unique secret preventing double-spend |
| `token` | `address` | `Field` (as `asset_id`) | ERC20 token contract address |
| `amount` | `uint256` | `Field` | Deposit amount in token's smallest unit |
| `salt` | `bytes32` | `Field` (as `blinding`) | Random blinding factor for privacy |

**Commitment**: `commitment = H(nullifier, token, amount, salt)` — computed off-chain by the user.

**Relationships**:
- Produces one `Leaf` in the Merkle tree (at `nextLeafIndex`)
- Consumes one `Nullifier` (marks `nullifiers[nullifier] = true` to prevent reuse)
- Updates `tokenBalances[token] += amount`

---

### 3. ERC20 Withdrawal

An ERC20 withdrawal spends a note and optionally creates a change note (UTXO model).

**Public Inputs** (sent to the ZK verifier):

| Field | Type | Description |
|-------|------|-------------|
| `root` | `bytes32` | Merkle tree root at time of proof generation |
| `nullifierHash` | `bytes32` | Public nullifier hash (derived from private nullifier) |
| `changeCommitment` | `bytes32` | Commitment for the change note (if any remaining balance) |
| `actionHash` | `bytes32` | `pedersen(recipient, token, amount)` — verified by circuit |
| `amount` | `uint256` | Amount being withdrawn |

**Transaction Parameters** (on-chain, plaintext):

| Field | Type | Description |
|-------|------|-------------|
| `proof` | `bytes` | ZK proof data |
| `token` | `address` | ERC20 token to withdraw |
| `recipient` | `address` | Receiver of the tokens |
| `amount` | `uint256` | Amount to transfer |

**Relationships**:
- Spends one nullifier (`nullifiers[nullifierHash] = true`)
- Creates one change commitment in the Merkle tree
- Transfers `amount` of `token` from vault to `recipient`
- Updates `tokenBalances[token] -= amount`

---

### 4. Permit2 Deposit (Production Path)

Uses Permit2's `SignatureTransfer` with witness binding.

**Permit Parameters**:

| Field | Type | Description |
|-------|------|-------------|
| `permit` | `ISignatureTransfer.PermitTransferFrom` | Token permissions (token, amount, nonce, deadline) |
| `signature` | `bytes` | EIP-712 signature over permit + witness |
| `commitment` | `bytes32` | Deposit commitment (bound into witness) |
| `nullifier` | `bytes32` | Deposit nullifier (bound into witness) |

**Witness Structure** (signed by user, verified by Permit2):

```solidity
struct DepositWitness {
    bytes32 commitment;
    bytes32 nullifier;
}
```

**Relationships**:
- User must have `token.approve(PERMIT2, type(uint256).max)` set (one-time)
- Permit2 verifies signature and transfers tokens atomically
- Witness binding prevents front-running / commitment substitution

---

### 5. Token Allowlist Entry

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `token` | `address` | ERC20 token contract address |
| `allowed` | `bool` | Whether deposits/withdrawals are permitted |

**State Transitions**:
- `addAllowedToken(token)`: `allowedTokens[token] = true` (owner only)
- `removeAllowedToken(token)`: `allowedTokens[token] = false` (owner only)
- Note: Removing a token does NOT affect existing deposits — users can still withdraw tokens previously deposited.

---

## Entity Relationships

```
User
  │
  ├── deposit ETH ──► Deposit Event ──► Merkle Leaf (commitment)
  │                                        │
  ├── depositERC20 ──► ERC20 Transfer ──► Merkle Leaf (commitment with token)
  │                    + tokenBalances++     │
  │                                          │
  ├── depositWithPermit ──► Permit2 ──► ERC20 Transfer ──► Merkle Leaf
  │                                    + tokenBalances++
  │
  ├── withdraw ETH ──► ZK Verify ──► ETH Transfer ──► Change Leaf
  │                    + nullifier spent
  │
  └── withdrawERC20 ──► ZK Verify ──► ERC20 Transfer ──► Change Leaf
                        + nullifier spent    + tokenBalances--

Owner
  │
  ├── addAllowedToken(token) ──► allowedTokens[token] = true
  └── removeAllowedToken(token) ──► allowedTokens[token] = false
```

---

## State Transitions

### ERC20 Deposit Flow

```
INITIAL STATE:
  nullifiers[nullifier] = false
  tokenBalances[token] = X
  nextLeafIndex = N
  currentRoot = R₀

AFTER depositERC20(token, amount, commitment, nullifier):
  nullifiers[nullifier] = true
  commitments[commitment] = true
  tokenBalances[token] = X + amount
  nextLeafIndex = N + 1
  currentRoot = keccak256(R₀, commitment)
  IERC20(token) transferred: user → vault (amount)
```

### ERC20 Withdrawal Flow

```
INITIAL STATE:
  nullifiers[nullifierHash] = false
  tokenBalances[token] = Y
  nextLeafIndex = M
  currentRoot = R₁

AFTER withdrawERC20(proof, root, nullifierHash, changeCommitment, actionHash, token, recipient, amount):
  nullifiers[nullifierHash] = true
  commitments[changeCommitment] = true
  tokenBalances[token] = Y - amount
  nextLeafIndex = M + 1
  currentRoot = keccak256(R₁, changeCommitment)
  IERC20(token) transferred: vault → recipient (amount)
```

---

## Validation Rules

### Deposit Validations
1. `commitment != bytes32(0)` — Invalid commitment
2. `!nullifiers[nullifier]` — Nullifier already used
3. `amount > 0` — Invalid token amount
4. `nextLeafIndex < 1048576` — Tree at capacity
5. `token != address(0)` — Must use ETH deposit for native ETH (ERC20 functions only)
6. `allowedTokens[token]` — Token not in allowlist
7. `msg.value == 0` — Cannot send ETH with ERC20 deposit

### Withdrawal Validations
1. `amount > 0` — Invalid amount
2. `token != address(0)` — Must use ETH withdraw for native ETH
3. `tokenBalances[token] >= amount` — Insufficient token balance
4. `!nullifiers[nullifierHash]` — Nullifier already spent
5. `root == currentRoot` — Invalid Merkle root
6. `verifier.verify(proof, publicInputs)` — ZK proof verification failed
7. `changeCommitment != bytes32(0)` — Invalid change commitment

---

## Privacy Considerations

1. **Unified Merkle tree**: ETH and ERC20 commitments share the same tree, maximizing the anonymity set. An observer cannot distinguish ETH deposits from ERC20 deposits by looking at the tree structure alone.

2. **Token binding in commitment**: The token address is a private input to the circuit, embedded in the commitment hash. This prevents asset substitution attacks without revealing the token type on-chain until withdrawal.

3. **Withdrawal reveals token**: When `withdrawERC20()` is called, the `token` parameter is plaintext on-chain. This is inherent — you must specify which token to transfer. The privacy guarantee is that the *source* (depositor) cannot be linked to the *destination* (withdrawer), not that the asset type is hidden at withdrawal time.

4. **Internal balance tracking**: Using `tokenBalances` mapping instead of `balanceOf()` prevents manipulation via direct token transfers (airdrops) and rebasing tokens.
