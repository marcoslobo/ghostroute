---

description: "Task list for PrivacyVault implementation"
---

# Tasks: PrivacyVault

**Input**: Design documents from `/specs/001-privacy-vault/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: REQUIRED for privacy/security features - Foundry tests with 100% branch coverage

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Smart contract project**: `ghostroute-contracts/`, `tests/` at repository root
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure per implementation plan
- [X] T002 Initialize Solidity project with OpenZeppelin, Permit2, and @zk-kit/lean-imt.sol dependencies
- [X] T003 [P] Configure Foundry testing framework and gas reporting
- [X] T004 [P] Setup linting and formatting tools for Solidity
- [X] T005 [P] Initialize Foundry remappings for external libraries

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Setup Merkle Tree structure using @zk-kit/lean-imt.sol library
- [X] T011 [P] Implement Permit2 integration constants and interfaces
- [X] T012 [P] Setup atomic transaction execution framework with reentrancy protection
- [X] T013 Create base error definitions and event structures
- [X] T014 Configure secure error handling that preserves privacy guarantees
- [X] T015 Setup gas optimization constants and zero-hash pre-computation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Privacy Deposit (Priority: P1) 🎯 MVP

**Goal**: Enable users to deposit ETH/ERC20 tokens with complete privacy via Permit2

**Independent Test**: Deposit funds and verify Merkle Tree updates correctly with no on-chain link between deposit transaction and resulting leaf

### Tests for User Story 1 (REQUIRED for privacy/security features) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T020 [P] [US1] Foundry test for ETH deposit in tests/PrivacyVault.t.sol
- [X] T021 [P] [US1] Foundry test for ERC20 deposit with Permit2 in tests/Permit2.t.sol
- [X] T022 [P] [US1] Integration test for invalid Permit2 signature handling in tests/PrivacyVault.t.sol
- [X] T023 [P] [US1] Foundry test for tree capacity error in tests/PrivacyVault.t.sol
- [X] T024 [P] [US1] Gas benchmark test for insertLeaf function in tests/GasBenchmark.t.sol

### Implementation for User Story 1

- [X] T025 [P] [US1] Create IPrivacyVault interface in ghostroute-contracts/interfaces/IPrivacyVault.sol
- [X] T026 [P] [US1] Create Deposit struct definitions in ghostroute-contracts/types/Deposit.sol
- [X] T027 [P] [US1] Create IMerkleTree interface in ghostroute-contracts/interfaces/IMerkleTree.sol
- [X] T028 [US1] Implement PrivacyVault state variables and constructor in ghostroute-contracts/PrivacyVault.sol
- [X] T029 [US1] Implement depositWithPermit function in ghostroute-contracts/PrivacyVault.sol (depends on T025, T026, T027, T028)
- [X] T030 [US1] Implement Merkle Tree insertion logic in ghostroute-contracts/PrivacyVault.sol (depends on T029)
- [X] T031 [US1] Implement Permit2 validation and token transfer logic in ghostroute-contracts/PrivacyVault.sol (depends on T029)
- [X] T032 [US1] Implement nullifier tracking and validation in ghostroute-contracts/PrivacyVault.sol (depends on T029)
- [X] T033 [US1] Add view functions (getMerkleRoot, verifyMerkleProof, getTreeInfo) in ghostroute-contracts/PrivacyVault.sol
- [X] T034 [US1] Add events and error definitions in ghostroute-contracts/PrivacyVault.sol

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Merkle Tree Management (Priority: P1)

**Goal**: Maintain efficient incremental Merkle Tree with optimal gas costs for leaf insertion

**Independent Test**: Insert multiple leaves and verify tree state transitions and root calculations remain consistent

### Tests for User Story 2 (REQUIRED for privacy/security features) ⚠️

- [ ] T040 [P] [US2] Foundry test for Merkle Tree state transitions in tests/MerkleTree.t.sol
- [ ] T041 [P] [US2] Foundry test for multiple sequential leaf insertions in tests/MerkleTree.t.sol
- [ ] T042 [P] [US2] Integration test for tree height 20 capacity in tests/MerkleTree.t.sol
- [ ] T043 [P] [US2] Gas efficiency test for insertLeaf operation in tests/GasBenchmark.t.sol

### Implementation for User Story 2

- [ ] T050 [P] [US2] Optimize LeanIMT library integration for height 20 tree in src/PrivacyVault.sol
- [ ] T051 [US2] Implement efficient zero-hash pre-computation in src/PrivacyVault.sol
- [ ] T052 [US2] Add gas-optimized leaf insertion algorithm in src/PrivacyVault.sol
- [ ] T053 [US2] Implement tree state consistency validation in src/PrivacyVault.sol
- [ ] T054 [US2] Optimize storage patterns for Merkle Tree state in src/PrivacyVault.sol

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T060 [P] Documentation updates in docs/
- [ ] T061 Code cleanup and refactoring for gas optimization
- [ ] T062 Performance optimization across all stories
- [ ] T063 [P] Additional fuzz testing in tests/fuzz/
- [ ] T064 [P] Formal verification preparation for ZK circuits
- [ ] T065 [P] Security audit preparation and threat model documentation
- [ ] T066 [P] Circuit constraint optimization for mobile/browser performance
- [ ] T067 Run quickstart.md validation and documentation review
- [ ] T068 Comprehensive gas analysis and optimization report

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 Merkle Tree but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Interfaces and types before main implementation
- Core functions before view functions
- Gas optimization after functionality works
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, both user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Interfaces and types within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Foundry test for ETH deposit in tests/PrivacyVault.t.sol"
Task: "Foundry test for ERC20 deposit with Permit2 in tests/Permit2.t.sol"
Task: "Integration test for invalid Permit2 signature handling in tests/PrivacyVault.t.sol"
Task: "Foundry test for tree capacity error in tests/PrivacyVault.t.sol"
Task: "Gas benchmark test for insertLeaf function in tests/GasBenchmark.t.sol"

# Launch all interfaces for User Story 1 together:
Task: "Create IPrivacyVault interface in src/interfaces/IPrivacyVault.sol"
Task: "Create Deposit struct definitions in src/types/Deposit.sol"
Task: "Create IMerkleTree interface in src/interfaces/IMerkleTree.sol"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Gas optimization is critical**: insertLeaf function must be < 100k gas
- **Security is paramount**: 100% branch coverage required for constitutional compliance