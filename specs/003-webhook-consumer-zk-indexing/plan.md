# Implementation Plan: Webhook Consumer for ZK Indexing

**Branch**: `003-webhook-consumer-zk-indexing` | **Date**: 2026-02-01 | **Spec**: [link](/home/marcos-lobo/projetos/hackathons/anonex/specs/003-webhook-consumer-zk-indexing/spec.md)
**Input**: Feature specification from `/specs/003-webhook-consumer-zk-indexing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement an off-chain Webhook Consumer service in `apps/indexer` to process ZK-related events (NewCommitment, NullifierSpent) from an external EVM listener. The service maintains a persistent Merkle Tree (Height 20) in PostgreSQL with idempotent processing and multi-vault isolation, exposing an API for Merkle Path retrieval to support frontend ZK-proof generation.

## Technical Context

**Language/Version**: TypeScript 20.x (Deno Runtime for Edge Functions)  
**Primary Dependencies**: Supabase Edge Functions, pg (Supabase PostgreSQL), poseidon-lite (hashing), uuid (idempotency)  
**Storage**: Supabase PostgreSQL (managed, connection pooling via Supabase)  
**Testing**: Deno test for unit tests, integration tests against local Supabase  
**Target Platform**: Supabase Edge Functions (serverless, global distribution)  
**Project Type**: Supabase Edge Function (off-chain indexer + API)  
**Performance Goals**: <50ms p95 globally distributed, handle 1000+ concurrent requests  
**Constraints**: Idempotent processing, multi-vault isolation by chainId+vaultAddress, handle reorgs gracefully  
**Scale/Scope**: Support multiple chains (chainId parameter), multiple vaults per chain, 20-height Merkle Tree (~1M leaves)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Assessment (Phase 0 Entry)
- **Privacy by Default**: ✓ Off-chain indexer only processes public commitment/nullifier hashes
- **Hook Architecture**: ✓ Pluggable event handlers for modularity
- **Economic Integrity**: ✓ Database transactions ensure atomic Merkle updates
- **Security Testing**: ✓ Idempotency and Merkle operations require 100% coverage
- **Circuit Design**: ✓ Merkle Path API optimized for frontend ZK-proof generation
- **Formal Verification**: ✓ Clean separation of concerns in handler/merkle/api layers

### Post-Design Re-Evaluation (Phase 1 Complete)
All constitutional principles verified:

| Principle | Status | Implementation Evidence |
|-----------|--------|------------------------|
| Privacy by Default | ✅ PASS | No private keys in codebase; only stores public hashes |
| Hook Architecture | ✅ PASS | Event handlers modular; can add new event types without refactoring |
| Economic Integrity | ✅ PASS | PostgreSQL transactions wrap Merkle updates; rollback on failure |
| Security Testing | ✅ PASS | Test coverage requirements defined for idempotency and Merkle operations |
| Circuit Design | ✅ PASS | Merkle Path endpoint returns 20-hash witness for Noir compatibility |
| Formal Verification | ✅ PASS | Separated concerns: handlers/, merkle/, api/, idempotency/ |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
anonex-zk-api/
├── supabase/
│   ├── config.toml          # Supabase configuration
│   ├── functions/
│   │   ├── webhook/
│   │   │   └── index.ts     # Webhook ingestion Edge Function
│   │   ├── merkle-root/
│   │   │   └── index.ts     # Get Merkle root endpoint
│   │   ├── merkle-path/
│   │   │   └── index.ts     # Get Merkle path (witness) endpoint
│   │   └── health/
│   │       └── index.ts     # Health check endpoint
│   └── migrations/          # SQL migrations for Supabase
├── src/
│   ├── merkle/
│   │   ├── tree.ts          # Merkle Tree implementation
│   │   ├── hasher.ts        # Poseidon hashing wrapper
│   │   └── path.ts          # Merkle Path computation
│   ├── handlers/
│   │   ├── webhook.ts       # Webhook ingestion handler
│   │   └── events.ts        # Event processors (NewCommitment, NullifierSpent)
│   ├── idempotency/
│   │   └── dedup.ts         # Idempotency key management
│   └── utils/
│       └── db.ts            # Supabase client helpers
├── tests/
│   ├── unit/
│   │   ├── merkle.test.ts
│   │   ├── hasher.test.ts
│   │   └── handlers.test.ts
│   └── integration/
│       └── functions.test.ts
├── deno.json
└── import_map.json
```

**Structure Decision**: Supabase Edge Functions project under `anonex-zk-api/`. Uses Deno runtime. Functions in `supabase/functions/` are deployed as Edge Functions. Database schema managed via Supabase migrations.

## Unknowns (Phase 0 Research Required)

The following items require research before Phase 1 design:

1. **Poseidon Hashing Library for Node.js** - Need to identify best library for BN254 Poseidon hash matching Noir circuit
2. **Merkle Tree Type** - Dense vs sparse Merkle tree for 20-height with ~1M leaves
3. **Webhook Delivery Guarantees** - At-least-once vs exactly-once semantics from external EVM listener
4. **Reorg Handling Strategy** - How to detect and handle blockchain reorganizations safely
5. **Database Schema for Incremental Merkle Tree** - Efficient storage pattern for tree nodes and roots
6. **API Performance Optimization** - Caching strategy for Merkle Path queries

## Phase 0: Research Output

See `research.md` for consolidated findings.

---

## Phase 1 Complete: Design Artifacts

### Generated Files
| File | Purpose |
|------|---------|
| `research.md` | Technical decisions with rationale |
| `data-model.md` | Entity definitions and API schemas |
| `quickstart.md` | Setup and usage guide |
| `contracts/openapi.yaml` | REST API specification |
| `plan.md` | This implementation plan |

### Key Design Decisions
1. **Hashing**: `poseidon-lite` + `scroll-tech/poseidon-bn254` for Noir compatibility
2. **Merkle Tree**: Sparse Merkle Tree (20-height) via `@zk-kit/smt`
3. **Webhook**: At-least-once delivery with database idempotency
4. **Reorgs**: Block confirmation threshold with rollback mechanism
5. **API**: Supabase Edge Functions (Deno runtime, serverless)
6. **Database**: Supabase PostgreSQL (managed, connection pooling)

### Next Steps (Phase 2)
- Generate `tasks.md` with implementation tasks
- Begin source code implementation in `anonex-zk-api/`
- Set up Supabase functions and database migrations
