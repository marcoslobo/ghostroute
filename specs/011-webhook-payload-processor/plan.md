# Implementation Plan: Webhook Payload Processor (Logic)

**Branch**: `011-webhook-payload-processor` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-webhook-payload-processor/spec.md`

## Summary

Implement the logic to parse and process the specific JSON payload format from the external EVM listener. This includes dynamic mapping of decoded parameters, idempotent event processing using TransactionHash + LogIndex, and Merkle Tree updates for UTXO management. The processor will integrate with the existing webhook consumer infrastructure to index privacy vault events.

## Technical Context

**Language/Version**: TypeScript 20.x (Deno Runtime for Edge Functions)
**Primary Dependencies**: pg (PostgreSQL client), poseidon-lite (hashing), uuid (idempotency)
**Storage**: PostgreSQL 15+ with connection pooling
**Testing**: Deno test framework with mock E2E scripts
**Target Platform**: Supabase Edge Functions / Deno Deploy
**Project Type**: Backend service (webhook consumer module)
**Performance Goals**: Sub-100ms processing per webhook event, support for 1000+ events/minute
**Constraints**: Stateless processing, connection pooling for DB, idempotency for reliability
**Scale/Scope**: Multi-vault, multi-chain indexing infrastructure

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacy by Default**: Implementation MUST NOT expose user private keys or create on-chain linkability ✓ (Processor only handles public event data, no private keys involved)
- **Hook Architecture**: Design MUST be modular and support future protocol adapters without breaking existing privacy guarantees ✓ (Modular event handling pattern)
- **Economic Integrity**: All transactions MUST be atomic with proper UTXO handling and fail-safe mechanisms ✓ (Idempotency + Merkle tree state consistency)
- **Security Testing**: 100% branch coverage REQUIRED for all Hook logic and Merkle Tree transitions ✓ (Will implement comprehensive test coverage)
- **Circuit Design**: Noir implementations MUST be optimized for mobile/web browser proof generation ✓ (N/A - this is TypeScript processor, not circuit code)
- **Formal Verification**: Code structure MUST support future formal verification of ZK-Verifier and Vault logic ✓ (Clean separation of concerns)

## Project Structure

### Documentation (this feature)

```text
specs/011-webhook-payload-processor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
ghostroute-zk-api/
├── src/
│   ├── models/
│   │   └── webhook-processor/
│   │       ├── types.ts          # Type definitions for webhook payload
│   │       ├── mapper.ts         # Dynamic mapping utility
│   │       ├── idempotency.ts    # Idempotency check logic
│   │       └── merkle-updater.ts  # Merkle tree update logic
│   ├── services/
│   │   └── event-processor.ts    # Main event processing service
│   └── lib/
│       └── database.ts           # Database operations
├── tests/
│   ├── unit/
│   │   ├── mapper.test.ts
│   │   ├── idempotency.test.ts
│   │   └── merkle-updater.test.ts
│   └── integration/
│       └── event-processor.test.ts
└── scripts/
    └── mock-e2e-test.ts         # E2E test script (existing)
```

**Structure Decision**: The webhook payload processor integrates into the existing `ghostroute-zk-api` structure under `src/models/webhook-processor/`. This follows the modular architecture of the existing codebase and integrates with the PostgreSQL database for idempotency checks.

## Complexity Tracking

> **No constitutional violations detected. All gates pass without complexity additions.**
