# Tasks: Uniswap Pool Investment via Privacy Vault

**Input**: Design documents from `/specs/014-erc20-deposit-withdraw/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Optional - not explicitly requested in specification. Focus on implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Frontend**: `ghostroute-ui/src/`
- **Webhook API**: `ghostroute-zk-api/supabase/functions/`
- **Contracts**: `ghostroute-contracts/` (existing - no changes needed)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create base utilities and type definitions needed by all user stories

- [X] T001 Create actionHash utility in ghostroute-ui/src/utils/utxo/actionHash.ts - implement `computeActionHash(poolId, tickLower, tickUpper, amount0Desired, amount1Desired)` using viem's keccak256 and encodePacked to match contract implementation
- [X] T002 [P] Create poolCompatibility utility in ghostroute-ui/src/utils/utxo/poolCompatibility.ts - implement `isPoolCompatible(pool, note)` and `getInvestmentSide(pool, note)` functions per contracts/api.md specification
- [X] T003 [P] Add PoolInvestmentParams and InvestmentPreview types in ghostroute-ui/src/types/utxo/investment.ts - define interfaces matching data-model.md TypeScript types section
- [X] T004 [P] Verify executeAction and computeActionHash exist in ghostroute-ui/src/services/privacyVault.ts ABI - check PRIVACY_VAULT_ABI includes executeAction function with correct parameters
- [X] T005 [P] Add ActionExecuted event to PRIVACY_VAULT_ABI in ghostroute-ui/src/services/privacyVault.ts - add event definition with nullifierHash (indexed), changeCommitment, actionHash, investAmount, timestamp, changeIndex fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook that all user stories depend on

**⚠️ CRITICAL**: User Story implementation depends on this phase

- [X] T006 Create usePoolInvestment hook skeleton in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - setup basic hook structure with useState for isPending, isConfirming, isGeneratingProof, error; use useAccount, useWriteContract, useWaitForTransactionReceipt from wagmi
- [X] T007 Implement calculateInvestment function in usePoolInvestment hook at ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - reuse calculateUTXO from utils/utxo/utxoMath.ts, add actionHash computation, return InvestmentPreview
- [X] T008 Implement isCompatiblePool function in usePoolInvestment hook at ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - import and wrap isPoolCompatibility utility
- [X] T009 Implement invest function with executeAction call in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - fetch Merkle root, compute nullifierHash/changeCommitment/actionHash, generate placeholder proof, call writeContract with executeAction
- [X] T010 Export usePoolInvestment from ghostroute-ui/src/hooks/utxo/index.ts - add export statement for the new hook

**Checkpoint**: Core investment hook ready - UI implementation can begin

---

## Phase 3: User Story 1 - Select Pool and Invest Note (Priority: P0) 🎯 MVP

**Goal**: User can select a pool from the list and invest funds from a deposited note

**Independent Test**: Navigate to pools page, select pool, choose note, enter amount, confirm transaction, verify investment executes and change note is created

### Implementation for User Story 1

- [X] T011 [US1] Create PoolInvestmentModal component in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - create modal component accepting pool: EnrichedPool, isOpen: boolean, onClose: function, onSuccess?: function props
- [X] T012 [US1] Add note selector dropdown to PoolInvestmentModal in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - use useNotes hook to get unspentNotes, filter by pool compatibility, render as select dropdown
- [X] T013 [US1] Add investment amount input with validation in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - add Input component for amount, validate > 0 and <= selected note value, show token symbol
- [X] T014 [US1] Add tick range configuration (tickLower, tickUpper) in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - add default tick range based on pool.tickSpacing, optional advanced toggle to customize
- [X] T015 [US1] Add confirm button with loading states in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - Button component that calls invest(), shows pending/confirming/generating states, disabled when invalid inputs
- [X] T016 [US1] Add selectedPool state to UniswapV4PoolsClient in ghostroute-ui/src/components/UniswapV4PoolsClient.tsx - add useState<EnrichedPool | null> for selectedPool, modalOpen boolean state
- [X] T017 [US1] Add "Invest" button to pool rows in ghostroute-ui/src/components/UniswapV4PoolsClient.tsx - add Button with "Invest" label next to existing "+ Liquidity" button, onClick sets selectedPool and opens modal
- [X] T018 [US1] Integrate PoolInvestmentModal into UniswapV4PoolsClient in ghostroute-ui/src/components/UniswapV4PoolsClient.tsx - render PoolInvestmentModal with selectedPool, isOpen, onClose props
- [X] T019 [US1] Handle success/error states and close modal on completion in ghostroute-ui/src/components/UniswapV4PoolsClient.tsx - add onSuccess callback to reset selectedPool, show success toast/alert

**Checkpoint**: User Story 1 complete - users can invest notes into pools from the UI

---

## Phase 4: User Story 2 - Investment Preview with UTXO Split (Priority: P0)

**Goal**: User sees a preview of investment transaction with amount breakdown before confirming

**Independent Test**: Enter investment amount, verify preview shows investment, gas estimate, and change note value

### Implementation for User Story 2

- [X] T020 [US2] Add preview state to PoolInvestmentModal in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - add useState<InvestmentPreview | null> for preview state
- [X] T021 [US2] Connect calculateInvestment from usePoolInvestment on amount change in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - useEffect to call calculateInvestment when amount/note/pool changes, update preview state
- [X] T022 [US2] Create InvestmentPreview UI component in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - Card component showing preview details with styled layout
- [X] T023 [US2] Display investment amount, gas estimate, and change note in preview in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - format values with token symbol, show breakdown clearly
- [X] T024 [US2] Display actionHash and pool info in preview in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - show truncated actionHash, pool pair name, tick range
- [X] T025 [US2] Add validation error display when funds insufficient in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - show Alert component when preview.error is set

**Checkpoint**: User Story 2 complete - users see full preview before investing

---

## Phase 5: User Story 3 - Generate ZK Proof and Execute Action (Priority: P0)

**Goal**: System generates ZK proof and calls executeAction on PrivacyVault

**Independent Test**: Confirm investment, verify proof is generated, transaction is submitted, nullifier is spent, change commitment is added

### Implementation for User Story 3

- [X] T026 [US3] Add proof generation step (placeholder for MVP) in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - create placeholder proof as 0x00 bytes (MockZKVerifier accepts any proof), set isGeneratingProof during process
- [X] T027 [US3] Compute nullifierHash from inputNote.nullifier in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - use keccak256(toBytes(inputNote.nullifier)) from viem
- [X] T028 [US3] Compute changeCommitment from change note in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - reuse computeChangeCommitment from utils/utxo/commitment.ts
- [X] T029 [US3] Fetch current Merkle root from contract in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - use publicClient.readContract with currentRoot() function, add timeout handling
- [X] T030 [US3] Call executeAction with writeContract in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - call with args [proof, root, nullifierHash, changeCommitment, actionHash, investAmount, uniswapParams], gas limit 300000
- [X] T031 [US3] Update note states on success (mark spent, save change note) in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - use markAsSpent and addNote from useNotes in onSuccess callback
- [X] T032 [US3] Add isGeneratingProof loading state to hook in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - add useState for isGeneratingProof, set true before proof generation, false after
- [X] T033 [US3] Show proof generation loading indicator in modal in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - display "Generating proof..." message with spinner when isGeneratingProof is true

**Checkpoint**: User Story 3 complete - full investment flow works end-to-end

---

## Phase 6: User Story 4 - Process Investment via Webhook (Priority: P1)

**Goal**: Webhook processes ActionExecuted events and updates Merkle tree with change commitments

**Independent Test**: Execute investment, verify webhook receives event, change commitment is added to Merkle tree in database

### Implementation for User Story 4

- [X] T034 [US4] Add ACTION_EXECUTED_TOPIC constant in ghostroute-zk-api/supabase/functions/_shared/adapters/listener-adapter.ts - compute keccak256 of 'ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)' event signature
- [X] T035 [US4] Create adaptActionExecutedEvent function in ghostroute-zk-api/supabase/functions/_shared/adapters/listener-adapter.ts - validate topic, decode indexed nullifierHash from topics[1], decode non-indexed params from data, return ActionExecutedPayload
- [X] T036 [US4] Add ActionExecutedPayload interface in ghostroute-zk-api/supabase/functions/_shared/handlers/webhook.ts - define interface with chainId, vaultAddress, nullifierHash, changeCommitment, actionHash, investAmount, timestamp, changeIndex, blockNumber, transactionHash
- [X] T037 [US4] Implement handleActionExecuted function in ghostroute-zk-api/supabase/functions/_shared/handlers/webhook.ts - get vault, get tree, create leaf hash, insert at changeIndex, update vault root
- [X] T038 [US4] Add ActionExecuted event routing in webhook index in ghostroute-zk-api/supabase/functions/webhook/index.ts - check if event matches ACTION_EXECUTED_TOPIC, call adaptActionExecutedEvent, then handleActionExecuted
- [X] T039 [US4] Add idempotency check for ActionExecuted events in ghostroute-zk-api/supabase/functions/webhook/index.ts - use isEventProcessed with nullifierHash + block as key, recordProcessedEvent after handling

**Checkpoint**: User Story 4 complete - change notes from investments can be spent in future transactions

---

## Phase 7: User Story 5 - Pool Selection with Token Matching (Priority: P1)

**Goal**: Only compatible pools (matching note token type) are investable

**Independent Test**: User with ETH note sees ETH/WETH pools highlighted; user with USDC note sees USDC pools highlighted

### Implementation for User Story 5

- [X] T040 [US5] Add getInvestmentSide function to poolCompatibility utility in ghostroute-ui/src/utils/utxo/poolCompatibility.ts - return 0 for token0 match, 1 for token1 match, -1 for no match
- [X] T041 [US5] Filter notes by pool compatibility in PoolInvestmentModal in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - use isCompatiblePool to filter unspentNotes before displaying in selector
- [X] T042 [US5] Show "No compatible notes" message when no notes match pool in ghostroute-ui/src/components/utxo/PoolInvestmentModal.tsx - render Alert with warning when filtered notes array is empty
- [X] T043 [US5] Add compatibility indicator to pool rows in UniswapV4PoolsClient in ghostroute-ui/src/components/UniswapV4PoolsClient.tsx - show green dot or badge next to pools that have compatible notes
- [X] T044 [US5] Disable Invest button when user has no compatible notes in ghostroute-ui/src/components/UniswapV4PoolsClient.tsx - check if any unspentNotes match pool, disable button and show tooltip if none

**Checkpoint**: User Story 5 complete - token matching fully implemented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T045 [P] Add error handling for all edge cases in usePoolInvestment hook at ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - handle wallet not connected, vault address not configured, invalid inputs, transaction failures
- [X] T046 [P] Add retry logic for Merkle root fetch in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - retry up to 3 times with exponential backoff if root fetch times out
- [X] T047 [P] Add console logging for debugging investment flow in ghostroute-ui/src/hooks/utxo/usePoolInvestment.ts - log key steps with [usePoolInvestment] prefix for debugging
- [X] T048 [P] Test actionHash computation matches contract in ghostroute-ui/src/utils/utxo/actionHash.ts - verify by calling contract's computeActionHash view function and comparing results
- [X] T049 Run quickstart.md validation - test full investment flow locally following specs/014-erc20-deposit-withdraw/quickstart.md instructions
- [X] T050 Update ghostroute-ui README with pool investment documentation - add section explaining investment feature and how to use it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories 1-3 (Phase 3-5)**: Depend on Foundational phase - can proceed sequentially (same component)
- **User Story 4 (Phase 6)**: Depends on Foundational - can proceed in parallel with frontend stories
- **User Story 5 (Phase 7)**: Depends on User Story 1 - needs pool list integration complete
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P0)**: Depends on Phase 2 - Core pool investment UI
- **User Story 2 (P0)**: Depends on US1 - Adds preview to existing modal
- **User Story 3 (P0)**: Depends on US2 - Adds proof generation and contract call
- **User Story 4 (P1)**: Independent of frontend - can be done in parallel by different developer
- **User Story 5 (P1)**: Depends on US1 - Adds token matching to existing UI

### Within Each User Story

- Tasks within a story should be done sequentially (same files)
- Commit after each task or logical group
- Each story checkpoint verifies independent functionality

### Parallel Opportunities

**Phase 1 (Setup)**:
- T001 must complete first (actionHash used by others)
- T002, T003, T004, T005 can run in parallel

**Cross-Story Parallelism**:
- Frontend stories (US1-US3, US5) share files - do sequentially
- Webhook story (US4) is independent - can run in parallel with frontend work

---

## Parallel Example: Setup Phase

```bash
# After T001 completes, launch remaining Setup tasks in parallel:
Task: "Create poolCompatibility utility in ghostroute-ui/src/utils/utxo/poolCompatibility.ts"
Task: "Add PoolInvestmentParams and InvestmentPreview types in ghostroute-ui/src/types/utxo/investment.ts"
Task: "Verify executeAction and computeActionHash exist in ABI"
Task: "Add ActionExecuted event to PRIVACY_VAULT_ABI"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (usePoolInvestment hook)
3. Complete Phase 3: User Story 1 (basic modal + pool list integration)
4. Complete Phase 4: User Story 2 (investment preview)
5. Complete Phase 5: User Story 3 (proof + contract call)
6. **STOP and VALIDATE**: Test full investment flow with quickstart.md
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Hook ready
2. Add US1 → Basic investment modal works
3. Add US2 → Preview shows UTXO split
4. Add US3 → Full contract interaction works → **MVP Complete!**
5. Add US4 → Webhook processes events → Change notes usable
6. Add US5 → Token matching → Better UX

### Parallel Team Strategy

With two developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1-3, 5 (Frontend)
   - Developer B: User Story 4 (Webhook)
3. Converge for Polish phase

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | T001-T005 (5 tasks) | Utilities and types |
| Phase 2: Foundational | T006-T010 (5 tasks) | Core investment hook |
| Phase 3: US1 - Pool Selection | T011-T019 (9 tasks) | Modal + pool list integration |
| Phase 4: US2 - Preview | T020-T025 (6 tasks) | Investment preview UI |
| Phase 5: US3 - Execute | T026-T033 (8 tasks) | Proof generation + contract call |
| Phase 6: US4 - Webhook | T034-T039 (6 tasks) | ActionExecuted event handling |
| Phase 7: US5 - Token Match | T040-T044 (5 tasks) | Compatibility filtering |
| Phase 8: Polish | T045-T050 (6 tasks) | Error handling + docs |
| **Total** | **50 tasks** | |

### MVP Scope (Recommended)

**Tasks T001-T033** (33 tasks) = Phases 1-5 = User Stories 1-3
- Full investment flow: select pool → select note → preview → confirm → execute
- Change note saved locally
- Can demo/deploy without webhook (change notes work from localStorage)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The contract (`executeAction`) already exists - no Solidity changes needed
- MVP = User Stories 1-3 (P0 priority) - minimum viable investment flow
