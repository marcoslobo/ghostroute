# Data Model: Uniswap Pool Investment via Privacy Vault

**Feature**: `014-uniswap-pool-investment`  
**Date**: 2026-02-07

---

## Overview

This data model extends the existing ERC20 deposit/withdraw model to support Uniswap v4 pool investments. The core entities are:

1. **Pool Investment Transaction** - User investing notes into pools
2. **ActionHash** - Binding pool parameters to ZK proofs
3. **Change Note** - UTXO created from investment remainder
4. **Webhook Events** - ActionExecuted event processing

---

## Core Entities

### 1. Pool Investment Parameters

Parameters required to execute a privacy-preserving pool investment.

**Fields (Frontend)**:

| Field | Type | Description |
|-------|------|-------------|
| `inputNote` | `Note` | The deposited note being spent |
| `pool` | `EnrichedPool` | Target Uniswap v4 pool |
| `investAmount` | `bigint` | Amount to invest (in note's token) |
| `tickLower` | `number` | Lower tick bound for LP position |
| `tickUpper` | `number` | Upper tick bound for LP position |

**Computed Values**:

| Field | Type | Description |
|-------|------|-------------|
| `actionHash` | `0x${string}` | `keccak256(poolId, tickLower, tickUpper, amount0, amount1)` |
| `changeNote` | `Note` | Remaining value after investment |
| `nullifierHash` | `0x${string}` | `keccak256(inputNote.nullifier)` |
| `changeCommitment` | `0x${string}` | Commitment for change note |

---

### 2. ActionHash Structure

The actionHash binds pool parameters to the ZK proof, preventing front-running.

**Components**:

| Component | Type (Solidity) | Type (Frontend) | Description |
|-----------|-----------------|-----------------|-------------|
| `poolId` | `bytes32` | `\`0x${string}\`` | Uniswap v4 pool identifier |
| `tickLower` | `int24` | `number` | Lower tick of LP position |
| `tickUpper` | `int24` | `number` | Upper tick of LP position |
| `amount0Desired` | `uint256` | `bigint` | Token0 amount for position |
| `amount1Desired` | `uint256` | `bigint` | Token1 amount for position |

**Computation**:
```solidity
actionHash = keccak256(abi.encodePacked(
    poolId,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired
));
```

---

### 3. executeAction Parameters (On-Chain)

Parameters passed to `PrivacyVault.executeAction()`.

| Field | Type | Description |
|-------|------|-------------|
| `proof` | `bytes` | ZK proof data (placeholder for MVP) |
| `root` | `bytes32` | Merkle root at proof generation time |
| `nullifierHash` | `bytes32` | Hash of input note's nullifier |
| `changeCommitment` | `bytes32` | Commitment for change note |
| `actionHash` | `bytes32` | Bound pool parameters hash |
| `investAmount` | `uint256` | Amount being invested |
| `uniswapParams` | `bytes` | Encoded pool parameters (reserved) |

---

### 4. EnrichedPool (Existing Entity - Extended)

Pool data displayed in UI and used for investment.

**Existing Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Pool ID (truncated for display) |
| `fullPoolId` | `\`0x${string}\`` | Full bytes32 pool ID |
| `fee` | `number` | Pool fee (in hundredths of bips) |
| `tickSpacing` | `number` | Tick spacing for positions |
| `hooks` | `Address` | Hook contract address |
| `token0` | `TokenInfo` | First token info |
| `token1` | `TokenInfo` | Second token info |
| `sqrtPriceX96` | `bigint?` | Current sqrt price |
| `tick` | `number?` | Current tick |
| `liquidity` | `bigint?` | Total liquidity |
| `chainId` | `SupportedChainId` | Network chain ID |

**New Computed Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `isCompatibleWithNote` | `(note: Note) => boolean` | Check if note token matches pool |

---

### 5. PoolInvestmentResult

Result returned after investment transaction.

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Whether investment succeeded |
| `transactionHash` | `string?` | Transaction hash if submitted |
| `changeNote` | `Note?` | Created change note |
| `error` | `string?` | Error message if failed |

---

### 6. ActionExecutedEvent (Webhook)

Event emitted by contract after successful investment.

**Solidity Event**:
```solidity
event ActionExecuted(
    bytes32 indexed nullifierHash,
    bytes32 changeCommitment,
    bytes32 actionHash,
    uint256 investAmount,
    uint256 timestamp,
    uint256 changeIndex
);
```

**Webhook Payload**:

| Field | Type | Description |
|-------|------|-------------|
| `chainId` | `number` | Network chain ID |
| `vaultAddress` | `string` | PrivacyVault contract address |
| `nullifierHash` | `string` | Spent nullifier hash |
| `changeCommitment` | `string` | New commitment for change note |
| `actionHash` | `string` | Action parameters hash |
| `investAmount` | `string` | Amount invested (as string) |
| `timestamp` | `number` | Block timestamp |
| `changeIndex` | `number` | Leaf index of change commitment |
| `blockNumber` | `number` | Block number of event |

---

## Entity Relationships

```
User Note (from deposit)
    │
    ├── Select Pool ──► EnrichedPool
    │                      │
    │                      ├── token0.id matches note.token?
    │                      └── token1.id matches note.token?
    │
    ├── Calculate UTXO ──► investAmount + changeNote
    │                         │
    │                         └── changeCommitment = H(changeNote)
    │
    ├── Compute actionHash ──► keccak256(poolId, ticks, amounts)
    │
    └── executeAction(proof, root, nullifierHash, changeCommitment, actionHash, amount, params)
           │
           ├── Nullifier marked spent
           ├── Change commitment added to tree
           └── ActionExecuted event emitted
                  │
                  └── Webhook processes ──► Merkle tree updated
```

---

## State Transitions

### Pool Investment Flow

```
INITIAL STATE:
  inputNote.spent = false
  nullifiers[nullifierHash] = false
  nextLeafIndex = N
  currentRoot = R₀
  
USER ACTIONS:
  1. Select pool from UI
  2. Enter investment amount
  3. Review preview (investment + gas + change)
  4. Confirm transaction

AFTER executeAction():
  inputNote.spent = true (localStorage)
  nullifiers[nullifierHash] = true (on-chain)
  nextLeafIndex = N + 1
  currentRoot = keccak256(R₀, changeCommitment)
  changeNote created and saved (localStorage)
  
AFTER Webhook:
  Merkle tree in DB updated with changeCommitment at index N
```

---

## TypeScript Types

### PoolInvestmentParams

```typescript
interface PoolInvestmentParams {
  inputNote: Note;
  pool: EnrichedPool;
  investAmount: bigint;
  tickLower: number;
  tickUpper: number;
  recipient?: `0x${string}`; // Defaults to vault for LP
}
```

### UsePoolInvestmentReturn

```typescript
interface UsePoolInvestmentReturn {
  invest: (params: PoolInvestmentParams) => Promise<PoolInvestmentResult>;
  calculateInvestment: (note: Note, pool: EnrichedPool, amount: bigint) => InvestmentPreview;
  isCompatiblePool: (pool: EnrichedPool, note: Note) => boolean;
  isPending: boolean;
  isConfirming: boolean;
  isGeneratingProof: boolean;
  error: string | null;
}
```

### InvestmentPreview

```typescript
interface InvestmentPreview {
  investAmount: bigint;
  gasEstimate: bigint;
  changeNote: Note;
  changeCommitment: `0x${string}`;
  actionHash: `0x${string}`;
  isValid: boolean;
  error?: string;
}
```

---

## Validation Rules

### Investment Validations

1. `inputNote.spent === false` - Note must be unspent
2. `inputNote.leafIndex !== undefined` - Note must have valid leafIndex
3. `investAmount > 0` - Must invest positive amount
4. `investAmount <= inputNote.value` - Cannot invest more than note value
5. `investAmount + gasEstimate <= inputNote.value` - Must have enough for gas
6. `isCompatiblePool(pool, inputNote)` - Token must match pool token
7. `tickLower < tickUpper` - Valid tick range
8. `tickLower % pool.tickSpacing === 0` - Tick aligned to spacing
9. `tickUpper % pool.tickSpacing === 0` - Tick aligned to spacing

### Proof Generation Validations

1. Valid Merkle root from contract
2. Valid nullifier from note
3. Valid change commitment computed
4. Valid actionHash computed

### Transaction Validations (On-Chain)

1. `verifier.verify(proof, publicInputs)` - ZK proof valid
2. `!nullifiers[nullifierHash]` - Nullifier not spent
3. `root == currentRoot` - Merkle root valid
4. `actionHash != bytes32(0)` - Action hash present
5. `changeCommitment != bytes32(0)` - Change commitment present

---

## Privacy Considerations

1. **Action hash binding**: The actionHash is computed off-chain and verified on-chain via ZK proof, preventing front-running of pool parameters.

2. **No depositor-investor link**: The ZK proof proves knowledge of a valid note without revealing which deposit it came from.

3. **Change notes**: The change note commitment is public, but its contents (amount, nullifier) remain private until spent.

4. **Pool visibility**: The pool being invested in is NOT revealed on-chain in the current implementation (executeAction only emits actionHash). In full production with PrivacyLiquidityHook integration, the pool would be visible when liquidity is added.

5. **Token inference**: If the investment token matches pool.token0 or pool.token1, the token type can be inferred. This is acceptable as the privacy guarantee is source-destination unlinkability, not asset type hiding.

---

## Migration Notes

This feature builds on existing entities:

- **Note** entity (from deposit) is unchanged
- **useNotes** hook is reused for note selection
- **useUTXOMath** is extended for investment calculations
- **Webhook** is extended with ActionExecuted handler
- **PRIVACY_VAULT_ABI** already includes executeAction
