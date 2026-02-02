# Phase 0 Research: Uniswap v4 Privacy Hook Adapter

## Research Date: 2026-01-31

## Technical Unknowns Resolved

### 1. Uniswap v4 Hook Architecture

**Decision:** Inherit from `BaseHook` from `v4-periphery/src/utils/BaseHook.sol`

**Rationale:**
- BaseHook provides the standard implementation pattern for Uniswap v4 hooks
- It includes the `onlyPoolManager` modifier for security
- It provides virtual functions that can be overridden (like `_beforeAddLiquidity`)
- Using BaseHook ensures compatibility with PoolManager's expected interface

**Implementation Pattern:**
```solidity
function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
    return Hooks.Permissions({
        beforeInitialize: false,
        afterInitialize: false,
        beforeAddLiquidity: true,  // Required for our use case
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
```

**Alternatives Considered:**
- Direct IHooks implementation: Rejected because it requires manual handling of all hook security and address validation

### 2. EIP-1153 Transient Storage for Authorization

**Decision:** Use transient storage (EIP-1153) to pass authorization state between Vault and Hook

**Rationale:**
- Transient storage allows state that persists only within a single transaction
- Perfect for passing "authorization granted" from PrivacyVault to Hook
- No persistent state needed, keeping the hook stateless
- Gas efficient compared to regular storage

**Pattern:**
- PrivacyVault validates ZK-proof and sets transient storage slot
- Hook reads the same transient storage slot to verify authorization
- Slot is automatically cleared at end of transaction

**Implementation Details:**
- Use Solidity's `tstore` and `tload` opcodes (available in ^0.8.24)
- Define a unique slot identifier (e.g., `keccak256("ghostroute.privacy.authorized")`)
- Store a boolean or authorized address in the slot

**Alternatives Considered:**
- Mapping with block-based expiry: Rejected due to complexity and gas costs
- Direct callback pattern: Rejected because it breaks atomic execution guarantees

### 3. PoolManager Settle Flow

**Decision:** Hook will use `poolManager.settle()` to complete asset transfers

**Rationale:**
- Uniswap v4 uses a "lock and call" pattern for operations
- Assets are credited/debited via BalanceDelta
- `settle()` pulls assets from a specified address to the PoolManager
- This is the standard flow for hooks that need to provide liquidity

**Flow:**
1. PrivacyVault calls Hook entry point with proof
2. Hook validates proof via transient storage
3. Hook initiates `modifyLiquidity` on PoolManager
4. PoolManager calls Hook's `beforeAddLiquidity`
5. Hook verifies transient storage authorization
6. PoolManager updates balances (creates deltas)
7. Hook calls `poolManager.settle()` to pull assets from Vault
8. Liquidity position is created

**Alternatives Considered:**
- Direct transfer before modifyLiquidity: Rejected because it doesn't follow v4's delta accounting model

### 4. actionHash Computation for Noir Circuit Alignment

**Decision:** Compute actionHash using standard Solidity keccak256 encoding

**Rationale:**
- Noir circuits typically use Poseidon or Pedersen hashes, but public inputs must match Solidity's computation
- Use keccak256 in both Noir (via standard library) and Solidity for perfect alignment
- Encode all relevant pool parameters in deterministic order

**Parameters to Hash:**
- PoolKey (currency0, currency1, fee, tickSpacing, hooks)
- ModifyLiquidityParams (tickLower, tickUpper, liquidityDelta, salt)
- Recipient address
- Vault address (to prove source)

**Implementation Pattern:**
```solidity
function computeActionHash(
    PoolKey calldata key,
    IPoolManager.ModifyLiquidityParams calldata params,
    address recipient
) public pure returns (bytes32) {
    return keccak256(abi.encode(
        key.currency0,
        key.currency1,
        key.fee,
        key.tickSpacing,
        params.tickLower,
        params.tickUpper,
        params.liquidityDelta,
        params.salt,
        recipient
    ));
}
```

**Alternatives Considered:**
- Poseidon hash (ZK-friendly): Rejected because Solidity implementation is expensive and complex
- Multiple hashes for different components: Rejected due to complexity in circuit design

### 5. Hook Address Mining Requirements

**Decision:** Use CREATE2 with address mining to get required hook flags

**Rationale:**
- Uniswap v4 requires hook addresses to have specific bits set based on permissions
- The `beforeAddLiquidity` flag corresponds to bit position in the address
- Must use CREATE2 with salt to find an address with the correct bits

**Required Flags:**
- `BEFORE_ADD_LIQUIDITY_FLAG` = 1 << 5 (based on Hooks.sol library)

**Implementation Tooling:**
- Use `HookMiner.find()` utility from v4-periphery
- Deploy with CREATE2 using the found salt

### 6. Security Considerations

**Critical Findings:**

1. **Reentrancy Protection:** Hook must use `onlyPoolManager` modifier on callbacks
2. **Address Encoding:** Hook address MUST have correct permission bits set at deployment
3. **Atomic Execution:** All operations must complete or revert together - transient storage helps enforce this
4. **No State Leakage:** Hook must not store any identifying information about the liquidity source

**Audit Recommendations from Research:**
- Never store user-specific data in the hook
- Always validate the caller is PoolManager in hook callbacks
- Use transient storage correctly to avoid persistence between transactions

### 7. Gas Optimization Strategies

**Optimizations:**
- Stateless design (no storage reads/writes except transient)
- Minimal computation in hook callbacks
- Efficient actionHash computation (single keccak256 call)
- Use `calldata` instead of `memory` for parameters

**Target Gas:** <200k gas per liquidity addition (including proof verification overhead)

## References

1. Uniswap v4 Core Documentation: https://docs.uniswap.org/contracts/v4
2. BaseHook Reference: https://docs.uniswap.org/contracts/v4/reference/periphery/utils/BaseHook
3. EIP-1153 Transient Storage: https://eips.ethereum.org/EIPS/eip-1153
4. Noir Documentation: https://noir-lang.org/docs
5. Hook Security Best Practices: https://hacken.io/discover/auditing-uniswap-v4-hooks/
