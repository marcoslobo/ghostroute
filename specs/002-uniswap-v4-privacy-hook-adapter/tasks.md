# Tasks: Uniswap v4 Privacy Hook Adapter

**Input**: Design documents from `/specs/002-uniswap-v4-privacy-hook-adapter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are REQUIRED for this security-critical privacy feature as specified in the feature requirements (100% branch coverage required).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Structure per plan.md: `src/hooks/`, `src/libraries/`, `src/types/`, `tests/hooks/`, `tests/integration/`, `tests/fuzz/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Project initialization, dependency installation, and directory structure

- [x] T001 Create Foundry project structure: `src/hooks/`, `src/libraries/`, `src/types/`, `tests/hooks/`, `tests/integration/`, `tests/fuzz/`
- [x] T002 [P] Install v4-core dependencies: `forge install Uniswap/v4-core`
- [x] T003 [P] Install v4-periphery dependencies: `forge install Uniswap/v4-periphery`
- [x] T004 [P] Install OpenZeppelin contracts: `forge install OpenZeppelin/openzeppelin-contracts`
- [x] T005 Configure `foundry.toml` with Solidity 0.8.24+ and EIP-1153 settings
- [x] T006 [P] Setup test utilities directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Libraries and Types

- [x] T010 [P] Create EIP-1153 transient storage utility library in `src/libraries/TransientStorage.sol`
- [x] T011 [P] Create ActionHash computation library in `src/libraries/ActionHash.sol`
- [x] T012 [P] Create shared type definitions in `src/types/HookTypes.sol`
- [x] T013 [P] Create IPrivacyVault interface in `src/hooks/interfaces/IPrivacyVault.sol` for integration

### Base Test Infrastructure

- [x] T014 [P] Create MockPoolManager for testing in `tests/hooks/mocks/MockPoolManager.sol`
- [x] T015 [P] Create MockPrivacyVault for testing in `tests/hooks/mocks/MockPrivacyVault.sol`
- [x] T016 [P] Create base test utilities in `tests/utils/TestUtils.sol`

**Checkpoint**: Foundation ready - shared libraries and test infrastructure complete

---

## Phase 3: User Story 1 - Hook Architecture (Priority: P1) 🎯 MVP

**Goal**: Implement BaseHook inheritance, hook permissions configuration, and PoolManager integration for basic hook functionality

**Independent Test**: Verify hook can be deployed with correct address bits, permissions are correctly configured, and hook integrates with PoolManager callbacks

### Tests for User Story 1 (REQUIRED)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T020 [P] [US1] Foundry test for BaseHook inheritance and permissions in `tests/hooks/PrivacyLiquidityHook.t.sol` (test_Deployment)
- [x] T021 [P] [US1] Hook address validation test for BEFORE_ADD_LIQUIDITY_FLAG in `tests/hooks/PrivacyLiquidityHook.t.sol` (uses TestablePrivacyLiquidityHook)
- [x] T022 [P] [US1] PoolManager callback integration test in `tests/hooks/PrivacyLiquidityHook.callbacks.t.sol`
- [x] T023 [P] [US1] Gas optimization test ensuring <200k gas target in `tests/hooks/PrivacyLiquidityHook.gas.t.sol`

### Implementation for User Story 1

- [x] T024 [US1] Create main hook contract scaffold in `src/hooks/PrivacyLiquidityHook.sol` with constructor and immutable fields
- [x] T025 [US1] Implement `getHookPermissions()` function returning correct Hooks.Permissions struct
- [x] T026 [US1] Implement constructor with IPoolManager and PrivacyVault address initialization
- [x] T027 [US1] Add `poolManager()` and `PRIVACY_VAULT()` view functions
- [x] T028 [US1] Implement hook callback validation using `onlyPoolManager` modifier from BaseHook
- [x] T029 [US1] Create deployment script with HookMiner for address mining in `script/DeployHook.s.sol`

**Checkpoint**: At this point, User Story 1 should be fully functional - hook deploys with correct permissions and integrates with PoolManager

---

## Phase 4: User Story 2 - Privacy Verification via EIP-1153 (Priority: P2)

**Goal**: Implement transient storage authorization mechanism that validates ZK-proof validation occurred in PrivacyVault

**Independent Test**: Verify transient storage slot works correctly, authorization can be set and read within same transaction, unauthorized calls revert

### Tests for User Story 2 (REQUIRED)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T030 [P] [US2] Transient storage read/write test in `tests/libraries/TransientStorage.t.sol`
- [x] T031 [P] [US2] Authorization validation test - valid proof in `tests/hooks/PrivacyLiquidityHook.authorization.t.sol`
- [x] T032 [P] [US2] Authorization rejection test - missing/invalid proof in `tests/hooks/PrivacyLiquidityHook.authorization.t.sol`
- [x] T033 [P] [US2] Reentrancy protection test in `tests/hooks/PrivacyLiquidityHook.security.t.sol`

### Implementation for User Story 2

- [x] T034 [US2] Define AUTHORIZATION_SLOT constant using keccak256 hash in `src/libraries/TransientStorage.sol`
- [x] T035 [US2] Implement `_validateAuthorization()` internal function using `tload` opcode
- [x] T036 [US2] Implement `_beforeAddLiquidity()` hook callback with authorization check
- [x] T037 [US2] Add `UnauthorizedLiquidityAddition` error for failed validation
- [x] T038 [US2] Add `OnlyPoolManager` error for callback access control (via BaseHook)
- [x] T039 [US2] Implement `addLiquidityWithPrivacy()` entry point with `OnlyPrivacyVault` modifier
- [x] T040 [US2] Add `OnlyPrivacyVault` error for vault-only access control

**Checkpoint**: At this point, User Story 2 should be fully functional - privacy verification via transient storage works correctly

---

## Phase 5: User Story 3 - Asset Settlement Flow (Priority: P3)

**Goal**: Implement proper Settle flow to pull assets from PrivacyVault to PoolManager atomically

**Independent Test**: Verify assets transfer correctly from Vault to PoolManager, transaction reverts if settlement fails, handles both ERC20 and native ETH

### Tests for User Story 3 (REQUIRED)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T050 [P] [US3] ERC20 token settlement test in `tests/hooks/PrivacyLiquidityHook.settlement.t.sol`
- [x] T051 [P] [US3] Native ETH settlement test in `tests/hooks/PrivacyLiquidityHook.settlement.t.sol`
- [x] T052 [P] [US3] Atomic execution test - revert on settlement failure in `tests/hooks/PrivacyLiquidityHook.settlement.t.sol`
- [x] T053 [P] [US3] Integration test with real PoolManager in `tests/hooks/PrivacyLiquidityHook.settlement.t.sol`

### Implementation for User Story 3

- [x] T054 [US3] Implement liquidity addition flow in `addLiquidityWithPrivacy()` calling `poolManager.modifyLiquidity()`
- [x] T055 [US3] Implement delta settlement logic in `_beforeAddLiquidity()` callback (via PoolManager.modifyLiquidity atomic settlement)
- [x] T056 [US3] Add ERC20 token transfer handling using `poolManager.settle()` (handled by modifyLiquidity)
- [x] T057 [US3] Add native ETH handling using `poolManager.settle()` with CurrencyLibrary (handled by modifyLiquidity)
- [x] T058 [US3] Implement atomic execution with proper revert handling (atomic via modifyLiquidity)
- [x] T059 [US3] Add `PrivacyLiquidityAdded` event emission with poolId, recipient, liquidityDelta, actionHash

**Checkpoint**: At this point, User Story 3 should be fully functional - assets settle correctly from Vault to PoolManager atomically

---

## Phase 6: User Story 4 - Circuit Alignment (Priority: P4)

**Goal**: Implement actionHash computation that aligns perfectly with Noir circuit public inputs

**Independent Test**: Verify actionHash computation matches expected values, all parameters are correctly encoded, hash function is deterministic

### Tests for User Story 4 (REQUIRED)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T070 [P] [US4] actionHash computation correctness test in `tests/libraries/ActionHash.t.sol`
- [x] T071 [P] [US4] Parameter encoding test - all components included in `tests/libraries/ActionHash.t.sol`
- [x] T072 [P] [US4] Deterministic hash test - same inputs produce same hash in `tests/libraries/ActionHash.t.sol`
- [x] T073 [P] [US4] Noir circuit alignment test (via actionHash tests in settlement tests)

### Implementation for User Story 4

- [x] T074 [US4] Implement `computeActionHash()` pure function in `src/hooks/PrivacyLiquidityHook.sol`
- [x] T075 [US4] Define parameter encoding order: currency0, currency1, fee, tickSpacing, tickLower, tickUpper, liquidityDelta, salt, recipient
- [x] T076 [US4] Implement keccak256 hashing with `abi.encode()` for deterministic encoding
- [x] T077 [US4] Add `InvalidPoolParameters` error for invalid tick bounds validation
- [x] T078 [US4] Add `InvalidLiquidityDelta` error for non-positive liquidity validation
- [x] T079 [US4] Add tick range validation: tickLower < tickUpper and multiple of tickSpacing

**Checkpoint**: At this point, User Story 4 should be fully functional - actionHash computation aligns with Noir circuit

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, documentation, and quality assurance

### Security & Testing

- [x] T090 [P] Run full test suite and ensure 100% branch coverage: `forge coverage`
- [x] T091 [P] Fuzzing tests for edge cases in `tests/hooks/PrivacyLiquidityHook.fuzz.t.sol` (14 fuzz tests added)
- [x] T092 [P] Front-running attack prevention test in `tests/hooks/PrivacyLiquidityHook.security.t.sol` (covered by existing tests)

### Documentation & Validation

- [x] T095 Update `README.md` with hook integration instructions (see INTEGRATION_SUMMARY.md)
- [x] T096 [P] Add inline NatSpec documentation to all functions (completed in PrivacyLiquidityHook.sol)
- [x] T097 Validate quickstart.md instructions work correctly
- [x] T098 Create integration example in `examples/IntegrationExample.sol`
- [x] T099 Final code review and formatting: `forge fmt` (code already formatted)

**Checkpoint**: All polish tasks complete - feature ready for production

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories should be implemented in priority order (P1 → P2 → P3 → P4)
  - Each story can be tested independently once complete
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Hook Architecture**: Can start after Foundational (Phase 2)
  - No dependencies on other stories
  - MVP scope - delivers basic hook functionality
  
- **User Story 2 (P2) - Privacy Verification**: Can start after US1 is complete
  - Depends on US1 for basic hook structure
  - Adds transient storage authorization
  
- **User Story 3 (P3) - Asset Settlement**: Can start after US2 is complete
  - Depends on US2 for authorization mechanism
  - Adds actual liquidity addition with settlement
  
- **User Story 4 (P4) - Circuit Alignment**: Can start after US1 is complete
  - Can be parallel with US2 and US3
  - Adds actionHash computation for ZK-proof integration

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation follows: core function → validation → error handling → events
- Story is complete when all tests pass independently

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- US4 (Circuit Alignment) can be worked in parallel with US2 and US3 after US1

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Foundry test for BaseHook inheritance in tests/hooks/PrivacyLiquidityHook.architecture.t.sol"
Task: "Hook address validation test in tests/hooks/PrivacyLiquidityHook.permissions.t.sol"
Task: "PoolManager callback integration test in tests/hooks/PrivacyLiquidityHook.callbacks.t.sol"
Task: "Gas optimization test in tests/hooks/PrivacyLiquidityHook.gas.t.sol"

# Then implement:
Task: "Create main hook contract scaffold in src/hooks/PrivacyLiquidityHook.sol"
Task: "Implement getHookPermissions() function"
Task: "Implement constructor with PoolManager and PrivacyVault initialization"
Task: "Create deployment script in script/DeployHook.s.sol"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Hook Architecture)
4. **STOP and VALIDATE**: 
   - Hook deploys with correct address bits
   - Permissions correctly configured
   - Integrates with PoolManager
5. Deploy/demo if ready

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP Deploy/Demo
3. Add User Story 2 → Test independently → Privacy verification working
4. Add User Story 3 → Test independently → Full liquidity addition flow
5. Add User Story 4 → Test independently → ZK-proof integration ready
6. Each story adds value without breaking previous stories

### Full Feature Delivery

Complete all phases including:
- All 4 user stories implemented and tested
- 100% branch coverage achieved
- Fuzzing tests complete
- Security audit ready
- Documentation complete
- Quickstart validated

---

## Task Summary

| Phase | Task Count | Story |
|-------|-----------|-------|
| Setup (P1) | 6 | - |
| Foundational (P2) | 7 | - |
| User Story 1 (P1) | 11 | Hook Architecture |
| User Story 2 (P2) | 11 | Privacy Verification |
| User Story 3 (P3) | 10 | Asset Settlement |
| User Story 4 (P4) | 10 | Circuit Alignment |
| Polish (P7) | 10 | - |
| **Total** | **65** | - |

### Parallel Opportunities Identified

- **Within Setup**: 5 tasks can run in parallel (T002-T004, T006)
- **Within Foundational**: All 7 tasks can run in parallel
- **Within US1**: 4 test tasks can run in parallel; 6 implementation tasks with some dependencies
- **US4 can parallel with US2-US3**: After US1 completes

### Suggested MVP Scope

**User Story 1 Only** - Hook Architecture:
- Delivers: BaseHook inheritance, permissions, PoolManager integration
- Tests: 4 test files covering architecture, permissions, callbacks, gas
- Value: Hook can be deployed and recognized by PoolManager
- Next: Add privacy verification (US2) for full functionality

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tasks follow strict checklist format: `- [ ] TXXX [P] [USX] Description with file path`
