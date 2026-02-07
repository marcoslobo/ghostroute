# Implementation Plan: Uniswap Pool Investment via Privacy Vault

**Branch**: `014-uniswap-pool-investment` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/014-erc20-deposit-withdraw/spec.md`

## Summary

Enable users to invest deposited notes (ETH/ERC20) into Uniswap v4 liquidity pools while maintaining privacy. Uses the existing `executeAction` function in PrivacyVault to validate ZK proofs and atomically record investment actions. The frontend connects the existing pool list with user notes, calculates UTXO splits, and executes privacy-preserving investments. The webhook is extended to process `ActionExecuted` events.

## Technical Context

**Language/Version**: 
- Solidity ^0.8.24 (contracts - existing)
- TypeScript 5.x + Next.js 14+ (frontend)
- TypeScript/Deno (webhook API)

**Primary Dependencies**:
- Wagmi ^2.x, Viem ^2.x (frontend)
- Uniswap v4 Core (contracts - existing)
- @zk-kit/smt (webhook Merkle tree)

**Storage**: 
- localStorage (notes, frontend)
- Supabase PostgreSQL (Merkle tree state, webhook)

**Testing**: 
- Foundry (contracts)
- Jest/Vitest (frontend)
- Deno test (webhook)

**Target Platform**: Web browser + EVM chains (Sepolia, mainnet)

**Project Type**: Web application (frontend + backend API + contracts)

**Performance Goals**: 
- Proof generation < 30 seconds
- Transaction gas < 300,000

**Constraints**: 
- Must use existing executeAction function
- Must maintain privacy (no depositor-investor linkability)
- Must be atomic (if pool add fails, nullifier not spent)

**Scale/Scope**: 
- MVP: Single-sided liquidity, placeholder proofs
- Phase 2: Full Uniswap hook integration, real ZK proofs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Privacy by Default** | PASS | ZK proof hides which note is spent; actionHash binds parameters |
| **Hook Architecture** | PASS | Uses existing modular PrivacyLiquidityHook; extensible to other protocols |
| **Economic Integrity** | PASS | UTXO model with change notes; atomic via nonReentrant |
| **Security Testing** | PENDING | Tests to be added in implementation phase |
| **Circuit Design** | PASS | Placeholder proofs for MVP; architecture supports real proofs |
| **Formal Verification** | PASS | Code structure unchanged; existing patterns maintained |

## Project Structure

### Documentation (this feature)

```text
specs/014-erc20-deposit-withdraw/
├── plan.md              # This file
├── research.md          # Research decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Usage examples
├── contracts/api.md     # API contracts
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
ghostroute-contracts/
├── PrivacyVault.sol                    # Existing - executeAction already implemented
├── src/hooks/PrivacyLiquidityHook.sol  # Existing - hook for pool additions
└── tests/
    └── PoolInvestment.t.sol            # New - investment flow tests

ghostroute-ui/
├── src/
│   ├── components/
│   │   ├── UniswapV4PoolsClient.tsx    # Modify - add Invest button
│   │   └── utxo/
│   │       ├── PoolInvestmentModal.tsx # New - investment modal
│   │       └── InvestmentForm.tsx      # Existing - reuse patterns
│   ├── hooks/utxo/
│   │   └── usePoolInvestment.ts        # New - investment hook
│   ├── utils/utxo/
│   │   ├── actionHash.ts               # New - actionHash computation
│   │   └── poolCompatibility.ts        # New - token matching
│   └── services/
│       └── privacyVault.ts             # Existing - ABI already has executeAction

ghostroute-zk-api/
└── supabase/functions/
    ├── _shared/
    │   ├── adapters/
    │   │   └── listener-adapter.ts     # Modify - add ActionExecuted
    │   └── handlers/
    │       └── webhook.ts              # Modify - add handleActionExecuted
    └── webhook/
        └── index.ts                    # Modify - route ActionExecuted events
```

**Structure Decision**: Web application pattern. Frontend (Next.js) + API (Supabase Edge Functions) + Contracts (Foundry).

## Implementation Tasks

### Phase 1: Frontend Core (Priority: P0)

1. **Create `usePoolInvestment` hook**
   - Combine existing UTXO math with pool-specific logic
   - Compute actionHash matching contract
   - Call executeAction with correct parameters

2. **Create `PoolInvestmentModal` component**
   - Note selector (from useNotes)
   - Amount input with validation
   - Tick range configuration
   - Investment preview
   - Confirm button

3. **Create utility functions**
   - `computeActionHash(poolId, ticks, amounts)`
   - `isPoolCompatible(pool, note)`
   - `getInvestmentSide(pool, note)`

4. **Modify `UniswapV4PoolsClient`**
   - Add "Invest" button to pool rows
   - Open modal with pool data
   - Handle success/error states

### Phase 2: Webhook Extension (Priority: P1)

5. **Extend listener adapter**
   - Add ActionExecuted event signature
   - Create `adaptActionExecutedEvent` function

6. **Add webhook handler**
   - Create `handleActionExecuted` function
   - Insert change commitment to Merkle tree
   - Update vault root in database

### Phase 3: Testing (Priority: P1)

7. **Frontend tests**
   - usePoolInvestment hook tests
   - actionHash computation tests
   - Pool compatibility tests

8. **Contract tests**
   - executeAction with various parameters
   - ActionExecuted event emission
   - Change commitment insertion

9. **E2E tests**
   - Full investment flow (deposit → invest → verify change note)

## Complexity Tracking

> No violations - design uses existing architecture patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| No new contracts | Reuse executeAction | Already handles ZK proof + UTXO |
| Placeholder proofs | MVP approach | MockZKVerifier accepts any proof |
| Single-sided liquidity | Simplify UX | User doesn't need multiple notes |

## Dependencies

This feature depends on:
- Deposited notes existing (from 001-privacy-vault)
- Pool list working (from existing UI)
- executeAction function (already implemented)
- Webhook infrastructure (from 003-webhook-consumer)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| actionHash mismatch | Transaction reverts | Use contract's computeActionHash view |
| Merkle root changes | Transaction reverts | Retry with fresh root |
| Webhook downtime | Change notes not in tree | Change notes still saved locally |
