# Data Model: Uniswap v4 Privacy Hook Adapter

## Entity Overview

This system consists of the following entities:

1. **PrivacyLiquidityHook** - Main hook contract
2. **PoolKey** - Uniswap v4 pool identifier (external type)
3. **ModifyLiquidityParams** - Parameters for liquidity operations (external type)
4. **TransientAuthorization** - EIP-1153 transient storage structure
5. **ActionHash** - Computed hash for ZK-proof verification

## Entity Definitions

### 1. PrivacyLiquidityHook

**Purpose:** Uniswap v4 hook that enables privacy-preserving liquidity addition

**Fields:**
| Field | Type | Visibility | Description |
|-------|------|------------|-------------|
| poolManager | IPoolManager | immutable | Reference to Uniswap v4 PoolManager |
| PRIVACY_VAULT | address | immutable constant | Address of the authorized PrivacyVault |
| AUTHORIZATION_SLOT | bytes32 | constant | Transient storage slot for authorization |

**Functions:**

#### Public/External Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| constructor | `(IPoolManager _poolManager, address _privacyVault)` | Initialize hook with dependencies |
| computeActionHash | `(PoolKey, ModifyLiquidityParams, address) → bytes32` | Compute hash for ZK-proof public inputs |
| addLiquidityWithPrivacy | `(PoolKey, ModifyLiquidityParams, bytes, bytes32[]) → void` | Entry point for privacy liquidity |
| getHookPermissions | `() → Hooks.Permissions` | Define hook callbacks enabled |

#### Hook Callbacks (Internal)

| Function | Signature | Purpose |
|----------|-----------|---------|
| _beforeAddLiquidity | `(address, PoolKey, ModifyLiquidityParams, bytes) → bytes4` | Validate authorization via transient storage |

#### Private/Internal Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| _validateAuthorization | `() → bool` | Check transient storage for valid authorization |
| _authorizeInTransient | `(address) → void` | Set authorization in transient storage |

### 2. PoolKey (External - Uniswap v4)

**Purpose:** Unique identifier for a Uniswap v4 pool

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| currency0 | Currency | First token in the pair (ordered) |
| currency1 | Currency | Second token in the pair (ordered) |
| fee | uint24 | Pool fee tier (e.g., 3000 = 0.3%) |
| tickSpacing | int24 | Tick spacing for the pool |
| hooks | IHooks | Hook contract address (this contract) |

### 3. ModifyLiquidityParams (External - Uniswap v4)

**Purpose:** Parameters for adding/removing liquidity

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| tickLower | int24 | Lower tick bound for position |
| tickUpper | int24 | Upper tick bound for position |
| liquidityDelta | int128 | Amount of liquidity to add (positive) or remove (negative) |
| salt | bytes32 | Optional salt for position uniqueness |

### 4. TransientAuthorization

**Purpose:** EIP-1153 transient storage structure

**Storage Layout:**
| Slot | Type | Content |
|------|------|---------|
| AUTHORIZATION_SLOT | address | Address authorized to add liquidity (set by Vault, read by Hook) |

**Lifecycle:**
1. PrivacyVault validates ZK-proof
2. PrivacyVault sets `tstore(AUTHORIZATION_SLOT, recipient)`
3. PrivacyVault calls Hook entry point
4. Hook's `beforeAddLiquidity` reads `tload(AUTHORIZATION_SLOT)`
5. Hook validates authorization
6. Transaction ends, transient storage automatically cleared

### 5. ActionHash

**Purpose:** Public input for ZK-proof verification

**Structure (for hashing):**
| Component | Type | Source |
|-----------|------|--------|
| currency0 | address | PoolKey.currency0 |
| currency1 | address | PoolKey.currency1 |
| fee | uint24 | PoolKey.fee |
| tickSpacing | int24 | PoolKey.tickSpacing |
| tickLower | int24 | ModifyLiquidityParams.tickLower |
| tickUpper | int24 | ModifyLiquidityParams.tickUpper |
| liquidityDelta | int128 | ModifyLiquidityParams.liquidityDelta |
| salt | bytes32 | ModifyLiquidityParams.salt |
| recipient | address | User parameter |

**Hash Function:** `keccak256(abi.encode(...all components...))`

**Alignment with Noir Circuit:**
- Noir circuit uses same keccak256 implementation
- Same parameter order and encoding
- Public inputs in circuit match Solidity's computed hash

## State Transitions

### Privacy-Preserving Liquidity Addition Flow

```
[User with ZK-Proof]
    ↓
[Call PrivacyVault.executeAction]
    ↓
[Vault validates ZK-proof]
    ↓
[Vault sets tstore(AUTHORIZATION_SLOT, recipient)]
    ↓
[Vault calls Hook.addLiquidityWithPrivacy]
    ↓
[Hook calls poolManager.modifyLiquidity]
    ↓
[PoolManager calls Hook.beforeAddLiquidity]
    ↓
[Hook validates tload(AUTHORIZATION_SLOT)]
    ↓
[Validation Success]
    ↓
[PoolManager creates liquidity position]
    ↓
[Hook settles deltas via poolManager.settle]
    ↓
[Assets transferred from Vault to PoolManager]
    ↓
[Position NFT issued to recipient]
    ↓
[Transient storage cleared (automatic)]
```

## Validation Rules

### Input Validation

1. **PoolKey Validation:**
   - currency0 < currency1 (Uniswap requirement)
   - fee is valid tier
   - tickSpacing matches fee tier
   - hooks address is this contract

2. **ModifyLiquidityParams Validation:**
   - liquidityDelta > 0 (only adding liquidity)
   - tickLower < tickUpper
   - Both ticks must be multiples of tickSpacing
   - Ticks within valid range (MIN_TICK to MAX_TICK)

3. **Authorization Validation:**
   - Transient storage must be set
   - Caller must be PoolManager in hook callback
   - Only PrivacyVault can set authorization

### Access Control

| Function | Caller | Restriction |
|----------|--------|-------------|
| constructor | Deployer | One-time only |
| addLiquidityWithPrivacy | PrivacyVault | Must be authorized vault |
| beforeAddLiquidity | PoolManager | Only via PoolManager callback |
| computeActionHash | Anyone | Pure function |

## Integration Points

### External Contracts

1. **IPoolManager (Uniswap v4)**
   - Interface for modifyLiquidity
   - Provides settle() for completing transfers
   - Calls hook callbacks

2. **IPrivacyVault (001-privacy-vault)**
   - Validates ZK-proofs
   - Sets transient authorization
   - Initiates liquidity addition

3. **IERC20 / Currency (Uniswap v4)**
   - Token interface for transfers
   - Native ETH handling via CurrencyLibrary

## Invariants

1. **Statelessness:** Hook has no persistent storage (except immutable constructor args)
2. **Atomicity:** Either all operations succeed or all revert
3. **Privacy:** No on-chain link between deposit source and liquidity position
4. **Authorization:** Only valid ZK-proofs can trigger liquidity addition
5. **Gas Efficiency:** All operations must complete within reasonable gas limits
