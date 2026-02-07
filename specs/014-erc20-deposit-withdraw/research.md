# Research: Uniswap Pool Investment via Privacy Vault

**Feature Branch**: `014-uniswap-pool-investment`  
**Date**: 2026-02-07

---

## Previous Research (ERC20 Deposit/Withdraw)

The following decisions from the ERC20 feature are still valid and apply to pool investment:

- **SafeERC20 Pattern**: Use OpenZeppelin's SafeERC20 for token transfers
- **Token Allowlist**: Block fee-on-transfer and rebasing tokens
- **Permit2 Integration**: Use SignatureTransfer for production path
- **Balance Tracking**: Internal accounting with `tokenBalances` mapping
- **Reentrancy Protection**: CEI + nonReentrant + allowlist
- **Commitment Structure**: `H(nullifier, token, amount, salt)`

---

## New Research: Pool Investment Integration

### Decision 1: executeAction as Primary Entry Point

**Decision**: Use the existing `PrivacyVault.executeAction()` function (lines 280-365) as the primary entry point for pool investments.

**Rationale**:
- Already implements ZK proof verification
- Handles nullifier double-spend prevention
- Updates Merkle tree with change commitments
- Emits ActionExecuted event for webhook processing
- Currently only emits event (no actual Uniswap call) - sufficient for MVP

**Current executeAction Signature**:
```solidity
function executeAction(
    bytes calldata proof,
    bytes32 root,
    bytes32 nullifierHash,
    bytes32 changeCommitment,
    bytes32 actionHash,
    uint256 investAmount,
    bytes calldata uniswapParams  // Currently unused but reserved
) external nonReentrant
```

**Alternatives considered**:
- Direct pool interaction: Rejected - bypasses privacy guarantees
- New executePoolInvestment function: Rejected - unnecessary duplication

---

### Decision 2: ActionHash Computation for Pools

**Decision**: Compute actionHash as `keccak256(abi.encodePacked(poolId, tickLower, tickUpper, amount0Desired, amount1Desired))` to match the contract's `computeActionHash` function.

**Rationale**:
- Must match exactly between frontend and contract for ZK proof validity
- Binds the investment parameters to the proof (prevents front-running/tampering)
- Already implemented in PrivacyVault.sol lines 367-388

**Contract Implementation**:
```solidity
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
```

**Frontend Implementation Needed**:
```typescript
import { keccak256, encodePacked } from 'viem';

function computeActionHash(
  poolId: `0x${string}`,
  tickLower: number,
  tickUpper: number,
  amount0Desired: bigint,
  amount1Desired: bigint
): `0x${string}` {
  return keccak256(
    encodePacked(
      ['bytes32', 'int24', 'int24', 'uint256', 'uint256'],
      [poolId, tickLower, tickUpper, amount0Desired, amount1Desired]
    )
  );
}
```

---

### Decision 3: Pool Selection Strategy

**Decision**: Allow single-sided liquidity provision initially, matching note token to one side of the pool.

**Rationale**:
- Simplifies UX - user doesn't need multiple token notes
- Uniswap v4 supports concentrated liquidity with asymmetric positions
- For MVP, just need to prove the concept works

**Token Matching Logic**:
```typescript
function isPoolCompatible(pool: EnrichedPool, noteToken: string): boolean {
  const isETH = noteToken === '0x0000000000000000000000000000000000000000';
  const weth = getWETHAddress(pool.chainId);
  
  // ETH notes can invest in pools with WETH or native ETH
  if (isETH) {
    return pool.token0.id === weth || pool.token1.id === weth;
  }
  
  // ERC20 notes must match token0 or token1
  return pool.token0.id.toLowerCase() === noteToken.toLowerCase() || 
         pool.token1.id.toLowerCase() === noteToken.toLowerCase();
}
```

**Alternatives considered**:
- Require both tokens: Rejected - complex UX, requires note aggregation
- Automatic token swap: Rejected - adds slippage risk, complexity

---

### Decision 4: Proof Generation Strategy

**Decision**: Use placeholder proof for MVP (works with MockZKVerifier), with architecture ready for real Noir proofs.

**Rationale**:
- MockZKVerifier is currently deployed and accepts any proof
- Real ZK circuits (Noir) require more development time
- Current architecture already supports proof bytes parameter

**Proof Parameters Required**:
```typescript
interface ProofInputs {
  // Private inputs (not revealed on-chain)
  inputNote: {
    nullifier_secret: Uint8Array;
    blinding: Uint8Array;
    amount: bigint;
    token: string;
  };
  merklePath: string[];
  leafIndex: number;
  
  // Public inputs (verified on-chain)
  root: `0x${string}`;
  nullifierHash: `0x${string}`;
  changeCommitment: `0x${string}`;
  actionHash: `0x${string}`;
  investAmount: bigint;
}
```

---

### Decision 5: Webhook Event Processing

**Decision**: Extend the existing webhook to handle `ActionExecuted` events, adding change commitments to the Merkle tree.

**Rationale**:
- Webhook already processes Deposit events successfully
- Same infrastructure can handle ActionExecuted
- Change notes need to be in Merkle tree for future spending

**Event Signature**:
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

**Handler Implementation**:
```typescript
async function handleActionExecuted(payload: ActionExecutedPayload): Promise<void> {
  const { chainId, vaultAddress, changeCommitment, changeIndex, blockNumber } = payload;
  
  // Get or create vault
  const vault = await vaultService.getOrCreateVault(chainId, vaultAddress);
  const tree = vaultService.getTree(vault.id);
  
  // Create leaf hash and insert
  const leafHash = createLeafHash(changeCommitment, changeIndex);
  tree.insert(changeIndex, leafHash);
  
  // Update vault root
  await vaultService.updateVaultRoot(chainId, vaultAddress, tree.root, blockNumber);
}
```

---

### Decision 6: UI Component Architecture

**Decision**: Create a new `PoolInvestmentModal` component that opens when clicking "Invest" on a pool row, using existing hooks.

**Rationale**:
- Modal pattern allows focused interaction
- Reuses existing InvestmentForm logic
- Integrates naturally with pool list

**Component Hierarchy**:
```
UniswapV4PoolsClient
  └── PoolRow
        └── InvestButton (opens modal)
              └── PoolInvestmentModal
                    ├── NoteSelector (from useNotes)
                    ├── AmountInput
                    ├── InvestmentPreview (from useUTXOMath)
                    └── ConfirmButton (calls usePoolInvestment)
```

---

### Decision 7: UTXO Math for Investment

**Decision**: Reuse existing `calculateUTXO` function with investment-specific parameters.

**Current Implementation (useUTXOMath.ts)** already handles:
- Input note selection
- Investment amount calculation
- Gas estimation
- Change note creation
- Change commitment computation

**Enhancement Needed**:
Add pool-specific actionHash computation:
```typescript
interface PoolInvestmentParams extends UTXOMathParams {
  poolId: `0x${string}`;
  tickLower: number;
  tickUpper: number;
}
```

---

### Decision 8: Error Handling Strategy

**Decision**: Implement comprehensive error handling with user-friendly messages at each stage.

**Error Categories**:
1. **Pre-submission errors**
   - Insufficient funds in note
   - Invalid pool parameters
   - Note without leafIndex (legacy notes)

2. **Proof generation errors**
   - Circuit compilation failure
   - Timeout during proof generation

3. **Transaction errors**
   - ZK proof verification failed
   - Nullifier already spent
   - Invalid Merkle root

4. **Post-transaction errors**
   - Webhook processing failure (non-blocking)

---

### Decision 9: Gas Estimation

**Decision**: Use fixed gas estimate of 300,000 gas for investment transactions.

**Rationale**:
- executeAction is complex (ZK verification + Merkle update)
- Fixed estimate is safer than dynamic estimation
- Current withdraw uses 800,000 gas; investment should be similar

**Implementation**:
```typescript
const INVESTMENT_GAS_LIMIT = 300_000n;
const INVESTMENT_GAS_BUFFER = 1.2; // 20% buffer

function estimateInvestmentGas(gasPrice: bigint): bigint {
  return BigInt(Math.floor(Number(INVESTMENT_GAS_LIMIT * gasPrice) * INVESTMENT_GAS_BUFFER));
}
```

---

### Decision 10: Integration with Existing Pool List

**Decision**: Modify `UniswapV4PoolsClient` to pass pool data to investment modal instead of direct liquidity addition.

**Current Flow**:
```
Click "+ Liquidity" → handleAddLiquidity() → addLiquidity() (direct)
```

**New Flow**:
```
Click "Invest" → setSelectedPool() → Open PoolInvestmentModal → handleInvest() → executeAction()
```

**Key Change**:
Replace direct `addLiquidity` with privacy-preserving `executeAction` flow that uses notes.

---

## Unresolved Questions

1. **Full Uniswap Integration**: Currently executeAction only emits event. Should we implement actual PrivacyLiquidityHook integration?
   - **Decision**: Defer to Phase 2. MVP proves the UTXO + ZK proof flow works.

2. **Real ZK Proofs**: When should we switch from MockZKVerifier to real Noir proofs?
   - **Decision**: After MVP validation. Current architecture supports both.

3. **Multi-token Positions**: How to handle pools requiring two different tokens?
   - **Decision**: Phase 2 feature. Single-sided liquidity for MVP.

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| wagmi | ^2.x | Contract interactions |
| viem | ^2.x | Encoding/hashing utilities |
| @noir-lang/barretenberg | ^2.x | Future proof generation |

---

## Files to Modify

| File | Change |
|------|--------|
| `ghostroute-ui/src/components/UniswapV4PoolsClient.tsx` | Add Invest button, open modal |
| `ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx` | New component |
| `ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts` | New hook |
| `ghostroute-ui/src/utils/utxo/actionHash.ts` | New utility |
| `ghostroute-zk-api/supabase/functions/_shared/adapters/listener-adapter.ts` | Add ActionExecuted |
| `ghostroute-zk-api/supabase/functions/_shared/handlers/webhook.ts` | Add handleActionExecuted |
