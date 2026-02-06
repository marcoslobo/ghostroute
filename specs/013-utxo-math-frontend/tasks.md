# Tasks: UTXO Math for React Frontend

**Feature**: UTXO Math for React Frontend  
**Branch**: `013-utxo-math-frontend`  
**Generated**: 2026-02-04

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 21 |
| User Stories | 1 (single comprehensive story) |
| Parallelizable Tasks | 5 |
| Phases | 4 |
| **Completed Tasks** | **21** |
| **Remaining Tasks** | **0** |

## User Stories

| ID | Priority | Story | Test Criteria |
|----|----------|-------|---------------|
| US1 | P1 | Calculate UTXO change and generate commitment for executeAction | Investment of 2 ETH from 10 ETH note produces 7.99 ETH change with valid commitment |

## Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational)
    │
    ▼
Phase 3 (US1: UTXO Math & Commitment Generation)
```

## Parallel Execution Examples

Within Phase 3, these tasks can run in parallel:
- T008 (UTXO types) and T009 (Note types)
- T010 (utxoMath.ts) and T011 (commitment.ts)
- T012 (gasEstimator.ts) and T013 (executeAction service)

---

## Phase 1: Setup

**Goal**: Initialize project structure and dependencies

- [X] T001 Create frontend project structure per implementation plan: `mkdir -p frontend/src/{components,hooks,utils,types,services} frontend/tests/{unit,integration}`
- [X] T002 Create TypeScript config in frontend/: `frontend/tsconfig.json` with strict mode and path aliases
- [X] T003 Install dependencies in frontend/: `npm install poseidon-lite uuid`
- [X] T004 Create Jest config in frontend/: `frontend/jest.config.js` for unit testing

## Phase 2: Foundational

**Goal**: Create shared types and configuration for all user stories

- [X] T005 Create ETH token constants in frontend/src/config/tokens.ts: `ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'`
- [X] T006 Create gas constants in frontend/src/config/gas.ts: `EXECUTE_ACTION_GAS_BASE = 200000n`, `GAS_BUFFER_PERCENT = 20`
- [X] T007 Create environment config in frontend/src/config/privacy.ts: `PRIVACY_VAULT_ADDRESS`, `CHAIN_ID` from env vars

## Phase 3: US1 - UTXO Math & Commitment Generation

**Goal**: Implement UTXO math, change note generation, and executeAction integration  
**Test Criteria**: Investment of 2 ETH from 10 ETH note produces 7.99 ETH change with valid commitment

### Types

- [X] T008 [P] [US1] Create UTXO types in frontend/src/types/utxo.ts: `UTXOMathResult`, `GasEstimate`, `InvestmentParams` interfaces
- [X] T009 [P] [US1] Create Note type in frontend/src/types/note.ts: `Note` interface with commitment, nullifier, value, token, salt, createdAt

### Utilities

- [X] T010 [US1] Implement UTXO math in frontend/src/utils/utxoMath.ts: `calculateUTXO(params: InvestmentParams): UTXOMathResult` with balance conservation validation
- [X] T011 [US1] Implement commitment generation in frontend/src/utils/commitment.ts: `computeCommitment(note)`, `computeChangeCommitment(changeValue, token, salt)`, `randomSalt(): Uint8Array` using poseidon-lite
- [X] T012 [P] [US1] Implement gas estimation in frontend/src/utils/gasEstimator.ts: `estimateExecuteActionGas(publicClient, params): Promise<bigint>` with RPC fallback

### Services

- [X] T013 [US1] Implement executeAction service in frontend/src/services/executeAction.ts: `executeAction(params: ExecuteActionParams): Promise<{ transactionHash: string }>` using viem writeContract

### Hooks

- [X] T014 [US1] Create useUTXOMath hook in frontend/src/hooks/useUTXOMath.ts: React hook exposing `calculateUTXO`, `estimateGas`, `generateChangeCommitment` with loading states

### Components

- [X] T015 [US1] Create InvestmentForm component in frontend/src/components/InvestmentForm.tsx: Form with note selector, investment amount input, real-time change preview
- [X] T016 [US1] Create TransactionPreview component in frontend/src/components/TransactionPreview.tsx: Displays investment, gas estimate, change amount with commitment hex

### Integration

- [X] T017 [US1] Connect InvestmentForm to useUTXOMath in frontend/src/components/InvestmentForm.tsx: Wire form inputs to hook functions and display results
- [X] T018 [US1] Add executeAction call to TransactionPreview in frontend/src/components/TransactionPreview.tsx: Submit transaction with changeCommitment to PrivacyVault

## Phase 4: Polish & Cross-Cutting Concerns

**Goal**: Validation, error handling, and UX improvements

- [X] T019 [US1] Add sufficient funds validation in frontend/src/utils/utxoMath.ts: Check `inputNote.value >= investmentAmount + gasEstimate`
- [X] T020 [US1] Add error boundaries to InvestmentForm in frontend/src/components/InvestmentForm.tsx: Graceful failure for insufficient funds
- [X] T021 [US1] Add loading states to TransactionPreview in frontend/src/components/TransactionPreview.tsx: Show spinner during gas estimation and transaction submission

---

## Implementation Strategy

### MVP Scope (Phase 3 Only)

The MVP consists of T008-T018 which deliver the core functionality:
- User can input investment amount
- System calculates change (10 ETH - 2 ETH - 0.01 ETH gas = 7.99 ETH)
- System generates new change note with Poseidon commitment
- System calls executeAction with changeCommitment

### Incremental Delivery

| Increment | Tasks | Deliverable |
|----------|-------|-------------|
| 1 | T005-T007 | Shared configuration |
| 2 | T008-T009 | Type definitions |
| 3 | T010-T012 | Core utilities (utxoMath, commitment, gasEstimator) |
| 4 | T013 | executeAction service |
| 5 | T014 | useUTXOMath hook |
| 6 | T015-T016 | UI components |
| 7 | T017-T018 | Component integration |
| 8 | T019-T021 | Polish (validation, error handling) |

---

## File Path Summary

| Task | File Path |
|------|-----------|
| T005 | `ghostroute-ui/src/config/tokens.ts` |
| T006 | `ghostroute-ui/src/config/gas.ts` |
| T007 | `ghostroute-ui/src/config/privacy.ts` |
| T008 | `ghostroute-ui/src/types/utxo/index.ts` |
| T009 | `ghostroute-ui/src/types/utxo/note.ts` |
| T010 | `ghostroute-ui/src/utils/utxo/utxoMath.ts` |
| T011 | `ghostroute-ui/src/utils/utxo/commitment.ts` |
| T012 | `ghostroute-ui/src/utils/utxo/gasEstimator.ts` |
| T013 | `ghostroute-ui/src/services/executeAction.ts` |
| T014 | `ghostroute-ui/src/hooks/utxo/useUTXOMath.ts` |
| T015 | `ghostroute-ui/src/components/utxo/InvestmentForm.tsx` |
| T016 | `ghostroute-ui/src/components/utxo/TransactionPreview.tsx` |
