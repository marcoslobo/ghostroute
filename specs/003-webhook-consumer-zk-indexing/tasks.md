---
description: "Task list for Webhook Consumer for ZK Indexing"
---

# Tasks: Webhook Consumer for ZK Indexing

**Input**: Design documents from `/specs/003-webhook-consumer-zk-indexing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and not explicitly requested in the feature specification. Skip test tasks unless specified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Supabase Edge Functions

- [X] T001 Create project directory structure at `ghostroute-zk-api/` per plan.md
- [X] T002 Initialize Deno project with `deno.json` configuration
- [X] T003 Create `import_map.json` for external dependencies (poseidon-lite, @supabase/supabase-js, @zk-kit/smt)
- [X] T004 [P] Configure Supabase project structure with `supabase/config.toml`
- [X] T005 [P] Create SQL migration file `supabase/migrations/001_initial_schema.sql` with tables for vaults, merkle_nodes, processed_events

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Create database utilities in `ghostroute-zk-api/src/utils/db.ts` with Supabase client initialization
- [X] T011 [P] Implement Poseidon hasher wrapper in `ghostroute-zk-api/src/merkle/hasher.ts` using poseidon-lite and scroll-tech/poseidon-bn254
- [X] T012 [P] Implement base Merkle Tree interface in `ghostroute-zk-api/src/merkle/tree.ts` with @zk-kit/smt
- [X] T013 [P] Implement idempotency service in `ghostroute-zk-api/src/idempotency/dedup.ts` for deduplication key management
- [X] T014 Create vault service in `ghostroute-zk-api/src/handlers/events.ts` for vault lookup and creation by chainId+vaultAddress
- [X] T015 Configure environment variable types in `ghostroute-zk-api/.env.example`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Webhook Handler (Priority: P1) 🎯 MVP

**Goal**: Implement webhook ingestion for NewCommitment and NullifierSpent payloads with idempotency and multi-vault isolation

**Independent Test**: Send webhook payloads to `POST /webhook` and verify:
- NewCommitment: Vault created/updated, commitment stored, Merkle root updated
- NullifierSpent: Event recorded, nullifier marked as spent
- Duplicate payloads: Return 409 without reprocessing

### Implementation for User Story 1

- [X] T020 [P] [US1] Create webhook payload types in `ghostroute-zk-api/src/handlers/webhook.ts` for NewCommitmentPayload and NullifierSpentPayload
- [X] T021 [P] [US1] Implement payload validation schema in `ghostroute-zk-api/src/handlers/webhook.ts` with Zod or similar
- [X] T022 [US1] Implement webhook signature verification in `ghostroute-zk-api/src/handlers/webhook.ts` for X-Webhook-Signature header
- [X] T023 [US1] Implement NewCommitment event handler in `ghostroute-zk-api/src/handlers/events.ts` (inserts commitment, updates Merkle tree, records event)
- [X] T024 [US1] Implement NullifierSpent event handler in `ghostroute-zk-api/src/handlers/events.ts` (records nullifier, marks commitment as spent)
- [X] T025 [US1] Implement idempotency check in `ghostroute-zk-api/src/handlers/webhook.ts` using processed_events table
- [X] T026 [US1] Create Supabase Edge Function at `ghostroute-zk-api/supabase/functions/webhook/index.ts` for webhook endpoint

**Checkpoint**: User Story 1 complete - webhook ingestion works with idempotency

---

## Phase 4: User Story 2 - Merkle Engine (Priority: P2)

**Goal**: Implement persistent incremental Merkle Tree (Height 20) with Poseidon/BN254 hashing matching Noir circuit

**Independent Test**: After NewCommitment webhook, verify:
- Merkle tree nodes stored in database
- Root hash matches expected value from Noir circuit
- Path computation returns correct sibling hashes

### Implementation for User Story 2

- [X] T030 [P] [US2] Implement Merkle path computation in `ghostroute-zk-api/src/merkle/path.ts` for 20-level tree
- [X] T031 [P] [US2] Implement sparse Merkle tree update in `ghostroute-zk-api/src/merkle/tree.ts` with node persistence to database
- [X] T032 [US2] Implement block confirmation check in `ghostroute-zk-api/src/handlers/events.ts` for reorg handling
- [X] T033 [US2] Implement Merkle root retrieval in `ghostroute-zk-api/src/merkle/tree.ts` for current vault root
- [X] T034 [US2] Implement batch tree update for multiple commitments in `ghostroute-zk-api/src/merkle/tree.ts`

**Checkpoint**: User Story 2 complete - Merkle tree updates correctly with proper hashing

---

## Phase 5: User Story 3 - API Layer (Priority: P3)

**Goal**: Provide high-performance endpoint to serve 20-hash Merkle Path (witness) for frontend ZK-proof generation

**Independent Test**: Call `GET /merkle-path` and verify:
- Returns correct 20-hash Merkle path for any leaf index
- Path hashes match expected values for known commitments
- Response format matches openapi.yaml schema

### Implementation for User Story 3

- [X] T040 [P] [US3] Create Supabase Edge Function at `ghostroute-zk-api/supabase/functions/merkle-root/index.ts` for GET /merkle-root endpoint
- [X] T041 [P] [US3] Create Supabase Edge Function at `ghostroute-zk-api/supabase/functions/merkle-path/index.ts` for GET /merkle-path endpoint
- [X] T042 [US3] Implement MerklePathResponse schema matching openapi.yaml in `ghostroute-zk-api/src/merkle/path.ts`
- [X] T043 [US3] Add input validation (chainId, vaultId, leafIndex) in merkle-path function
- [X] T044 [US3] Add caching layer for frequently accessed Merkle paths in `ghostroute-zk-api/src/merkle/path.ts`

### Implementation for User Story 4

- [X] T050 [P] [US4] Create Supabase Edge Function at `ghostroute-zk-api/supabase/functions/health/index.ts` for GET /health endpoint
- [X] T051 [US4] Implement database connectivity check in `ghostroute-zk-api/src/utils/db.ts`
- [X] T052 [US4] Add Merkle tree integrity check in `ghostroute-zk-api/src/merkle/tree.ts`
- [X] T053 [US4] Add uptime tracking and version info in health function

**Checkpoint**: User Story 4 complete - Health endpoint available for monitoring

---

## Phase 7: User Story 5 - Blockchain Reorg Handling (Priority: P5)

**Goal**: Handle blockchain reorgs and duplicate webhook deliveries gracefully

**Independent Test**: Simulate reorg scenario and verify:
- Events at reverted block marked as reverted
- Merkle tree rolled back to common ancestor
- New events after reorg processed correctly

### Implementation for User Story 5

- [X] T060 [P] [US5] Implement reorg detection in `ghostroute-zk-api/src/handlers/events.ts` (lower block number than latest)
- [X] T061 [P] [US5] Implement tree rollback to common ancestor in `ghostroute-zk-api/src/merkle/tree.ts`
- [X] T062 [US5] Implement event reversion in `ghostroute-zk-api/src/handlers/events.ts` (update status to reverted)
- [X] T063 [US5] Implement re-fetch mechanism for reverted events from chain
- [X] T064 [US5] Add reorg logging and alerting in `ghostroute-zk-api/src/utils/db.ts`

**Checkpoint**: User Story 5 complete - System handles reorgs gracefully

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T070 [P] Add comprehensive logging across all functions in `ghostroute-zk-api/src/utils/db.ts`
- [X] T071 [P] Add error handling and response standardization in `ghostroute-zk-api/src/handlers/webhook.ts`
- [X] T072 [P] Optimize database queries with proper indexes in `supabase/migrations/001_initial_schema.sql`
- [X] T073 [P] Add Row Level Security (RLS) policies for data protection in `supabase/migrations/002_rls_policies.sql`
- [X] T074 Update `ghostroute-zk-api/quickstart.md` with final setup instructions
- [X] T075 [P] Create `README.md` with API documentation and examples

---

## Tests

### Unit Tests

- [X] T080 [P] Unit test for hasher in `tests/unit/hasher.test.ts`
- [X] T081 [P] Unit test for Merkle tree in `tests/unit/tree.test.ts`
- [X] T082 [P] Unit test for webhook handlers in `tests/unit/handlers.test.ts`

### Integration Tests

- [X] T090 [P] Integration test for webhook endpoint in `tests/integration/functions.test.ts`
- [X] T091 [P] Integration test for merkle-root endpoint
- [X] T092 [P] Integration test for health endpoint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories (MVP!)
- **User Story 2 (P2)**: Can start after Foundational - Depends on US1 data structures
- **User Story 3 (P3)**: Can start after Foundational - Depends on US2 Merkle implementation
- **User Story 4 (P4)**: Can start after Foundational - Independent of other stories
- **User Story 5 (P5)**: Can start after Foundational - Depends on US1 and US2

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 4 can start in parallel
- US2 depends on US1 data structures, US3 depends on US2
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch webhook payload types and validation together:
Task: "Create webhook payload types in ghostroute-zk-api/src/handlers/webhook.ts"
Task: "Implement payload validation schema in ghostroute-zk-api/src/handlers/webhook.ts"

# Launch webhook function and signature verification together:
Task: "Implement webhook signature verification in ghostroute-zk-api/src/handlers/webhook.ts"
Task: "Create Supabase Edge Function at ghostroute-zk-api/supabase/functions/webhook/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test webhook ingestion with NewCommitment payload
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Deploy/Demo
6. Add User Story 5 → Deploy/Demo
7. Polish phase → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (webhook handler)
   - Developer B: User Story 2 (Merkle engine)
   - Developer C: User Story 4 (health endpoint)
3. After US2: Developer B → US3 (API layer)
4. After US1 and US2: Developer A → US5 (reorg handling)
5. Stories complete and integrate independently

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 49 |
| **Setup Phase** | 5 tasks |
| **Foundational Phase** | 6 tasks |
| **User Story 1 (P1)** | 7 tasks - MVP |
| **User Story 2 (P2)** | 5 tasks |
| **User Story 3 (P3)** | 5 tasks |
| **User Story 4 (P4)** | 4 tasks |
| **User Story 5 (P5)** | 5 tasks |
| **Polish Phase** | 6 tasks |
| **Unit Tests** | 3 tasks |
| **Integration Tests** | 3 tasks |

### Parallel Execution Opportunities
- Phase 1: T001-T005 can run in parallel
- Phase 2: T010, T011, T012, T013, T014 can run in parallel
- User Story 1: T020-T021 can run in parallel
- User Story 2: T030-T031 can run in parallel
- User Story 5: T060-T061 can run in parallel

### MVP Scope
User Story 1 (Phase 3) is the MVP - webhook ingestion with idempotency. Complete Phase 1 + 2 + 3, then test and deploy.
