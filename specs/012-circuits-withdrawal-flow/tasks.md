---

description: "Task list for Circuit Withdrawal Flow Support feature"
---

# Tasks: Circuit Withdrawal Flow Support

**Feature Branch**: `012-circuits-withdrawal-flow` | **Date**: 2026-02-04  
**Input**: Design documents from `/specs/012-circuits-withdrawal-flow/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Included - circuit tests required for ZK verification

**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Circuit Environment)

**Purpose**: Verify circuit development environment is ready

- [X] T001 Verify Noir 1.0.0-beta.18 installation with `nargo --version`
- [X] T002 [P] Check barretenberg (bb) tool is available for verifier generation
- [X] T003 [P] Review existing circuit structure in `circuits/src/main.nr`
- [X] T004 [P] Backup current circuit file to `circuits/src/main.nr.backup`

---

## Phase 2: Foundational (Circuit Modification)

**Purpose**: Core modifications needed BEFORE user story implementation

**⚠️ CRITICAL**: Must complete before any user story

- [X] T010 Add `is_withdrawal: pub bool` public input parameter to main function signature in `circuits/src/main.nr:88`
- [X] T011 [P] Add `recipient: pub Field` public input parameter for withdrawal flow in `circuits/src/main.nr:89`
- [X] T012 Rename existing `invest_amount` parameter to `amount: pub Field` for unified handling in `circuits/src/main.nr`
- [X] T013 Create `compute_action_hash(recipient: Field, amount: Field) -> Field` helper function using pedersen_hash in `circuits/src/main.nr`
- [X] T014 Add action hash verification constraint for withdrawal flow in `circuits/src/main.nr` main function

**Checkpoint**: Foundational circuit modifications complete

---

## Phase 3: User Story 1 - Withdrawal Circuit Support (Priority: P1) 🎯 MVP

**Goal**: Implement core withdrawal functionality - verify actionHash = H(recipient, withdraw_amount) and balance constraint

**Independent Test**: Generate valid ZK proof for withdrawal and verify public outputs match expected values

### Tests for User Story 1 ⚠️

> **NOTE: Write tests FIRST, ensure they FAIL before implementation**

- [X] T020 [P] [US1] Add withdrawal test with valid actionHash in `circuits/src/main.nr:159`
- [X] T021 [P] [US1] Add withdrawal test with invalid actionHash (should fail) in `circuits/src/main.nr`
- [X] T022 [P] [US1] Add withdrawal test with balance constraint (amount = withdraw + change) in `circuits/src/main.nr`
- [X] T023 [P] [US1] Add withdrawal test with insufficient balance (should fail) in `circuits/src/main.nr`

### Implementation for User Story 1

- [X] T030 [P] [US1] Implement withdrawal action hash verification: `assert(action_hash == compute_action_hash(recipient, amount))` in `circuits/src/main.nr`
- [X] T031 [P] [US1] Update balance constraint for withdrawal: `assert(note.amount == amount + change_note.amount)` in `circuits/src/main.nr:127`
- [X] T032 [US1] Add conditional logic to handle is_withdrawal flag for action hash verification in `circuits/src/main.nr`
- [X] T033 [US1] Verify all existing Merkle proof logic still functions correctly

**Checkpoint**: User Story 1 complete - withdrawal proofs generate and verify correctly

---

## Phase 4: User Story 2 - Preserved Privacy Guarantees (Priority: P1)

**Goal**: Ensure withdrawal flow maintains unlinkability between input note and recipient

**Independent Test**: Analyze public inputs - verify no direct link between input note and recipient exists

### Tests for User Story 2 ⚠️

- [X] T040 [P] [US2] Add privacy test verifying recipient is not exposed in public inputs in `circuits/src/main.nr`
- [X] T041 [P] [US2] Add unlinkability test: multiple withdrawals from same note appear independent in `circuits/src/main.nr`

### Implementation for User Story 2

- [X] T050 [P] [US2] Document privacy properties in circuit comments explaining why recipient doesn't link to input note
- [X] T051 [P] [US2] Verify nullifier derivation remains unchanged (does not include recipient) in `circuits/src/main.nr`
- [X] T052 [US2] Verify action_hash uses pedersen_hash binding recipient+amount without revealing input note details

**Checkpoint**: User Story 2 complete - privacy guarantees verified

---

## Phase 5: User Story 3 - Existing Investment Flow Compatibility (Priority: P2)

**Goal**: Maintain backward compatibility with existing Uniswap investment flow

**Independent Test**: Existing investment proofs still verify correctly with updated circuit

### Tests for User Story 3 ⚠️

- [X] T060 [P] [US3] Run existing `test_compute_commitment` test in `circuits/src/main.nr:159`
- [X] T061 [P] [US3] Run existing `test_compute_nullifier` test in `circuits/src/main.nr:174`
- [X] T062 [P] [US3] Run existing `test_utxo_balance` test in `circuits/src/main.nr:184`
- [X] T063 [P] [US3] Run existing `test_utxo_balance_failure` test in `circuits/src/main.nr:205`
- [X] T064 [US3] Add test for investment flow with is_withdrawal=false in `circuits/src/main.nr`

### Implementation for User Story 3

- [X] T070 [P] [US3] Implement conditional logic: if is_withdrawal=false, action_hash passed through without verification in `circuits/src/main.nr`
- [X] T071 [P] [US3] Ensure existing balance constraint works for investment case in `circuits/src/main.nr`
- [X] T072 [US3] Update circuit comments to document both investment and withdrawal flows

**Checkpoint**: User Story 3 complete - backward compatibility maintained

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and optimization

- [X] T080 [P] Run `nargo compile` and verify circuit compiles successfully
- [X] T081 [P] Run `nargo test` and verify all tests pass
- [X] T082 Generate Verifier.sol with `bb write_vk` and `bb write_solidity_verifier` to `circuits/target/Verifier.sol`
- [X] T083 [P] Update circuit README documentation in `circuits/README.md` with withdrawal flow details
- [X] T084 Update AGENTS.md with testing commands for Noir circuit in `AGENTS.md`
- [X] T085 [P] Verify constraint count is reasonable for mobile/browser proof generation
- [X] T086 Run quickstart.md validation: build, test, and generate verifier

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) can proceed in parallel after Foundational
  - US3 (P2) can proceed in parallel or after US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Independent Test |
|-------|----------|------------|-----------------|
| US1: Withdrawal Support | P1 | Phase 2 | Generate valid withdrawal proof |
| US2: Privacy Guarantees | P1 | Phase 2 | Verify no linkability in public inputs |
| US3: Investment Compatibility | P2 | Phase 2 | Existing investment proofs still work |

### Within Each User Story

- Tests written first, must FAIL before implementation
- Core logic before conditional handling
- Story complete before moving to Polish phase

### Parallel Opportunities

- T001-T004 (Setup) all parallel
- T010-T014 (Foundational) - T010-T012 parallel, T013-T014 depend on T010
- T020-T023 (US1 Tests) all parallel
- T030-T031 (US1 Impl) parallel, T032-T033 depend on T030-T031
- T040-T041 (US2 Tests) parallel
- T050-T051 (US2 Impl) parallel
- T060-T064 (US3 Tests) parallel
- T070-T071 (US3 Impl) parallel
- T080-T086 (Polish) - T080-T081 parallel, T082-T085 parallel, T086 sequential

---

## Parallel Example: User Story 1

```bash
# Run all tests for User Story 1 together:
# T020, T021, T022, T023

# Run core implementation in parallel:
# T030, T031
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test withdrawal proof generation
5. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 → Test independently → Privacy guarantees added
4. Add US3 → Test independently → Full backward compatibility
5. Polish phase → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational done:
   - Developer A: User Story 1 (withdrawal core)
   - Developer B: User Story 2 (privacy validation)
3. Stories complete, add US3 (compatibility)
4. Final polish together

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 86 |
| Setup Tasks | 4 |
| Foundational Tasks | 5 |
| User Story 1 Tasks | 14 |
| User Story 2 Tasks | 8 |
| User Story 3 Tasks | 11 |
| Polish Tasks | 7 |
| Parallelizable Tasks | ~60% |

**Suggested MVP Scope**: Phase 1 → Phase 2 → Phase 3 (User Story 1 only)

**Total Test Count**: 12 tests (4 per user story for ZK verification)
