# Implementation Plan: UTXO Math for React Frontend

**Branch**: `013-utxo-math-frontend` | **Date**: 2026-02-04 | **Spec**: [link](/home/marcos-lobo/projetos/hackathons/anonex/specs/013-utxo-math-frontend/spec.md)
**Input**: Feature specification from `/specs/013-utxo-math-frontend/spec.md`

## Summary

Implement UTXO math logic in the GhostRoute React frontend to handle privacy-preserving DeFi interactions. The implementation will:
1. Track user notes and calculate spendable balances
2. Perform transaction math: change = input - investment - gas/fees
3. Generate new cryptographic secrets for change notes
4. Compute Poseidon hash commitments for change notes
5. Pass change commitments to the executeAction function

## Technical Context

**Language/Version**: TypeScript 5.x + Next.js 14+ (App Router) + Node.js 20 LTS  
**Primary Dependencies**: poseidon-lite (hashing), uuid (idempotency), @noir-lang/noirc_vm ^0.x (Wasm), @noir-lang/barretenberg ^2.x (Wasm), Wagmi ^2.x, Viem ^2.x  
**Storage**: Client-side only (localStorage for cached identity), /public for static circuit artifacts  
**Testing**: Jest + React Testing Library  
**Target Platform**: Web browser (client-side only)  
**Project Type**: Web application (Next.js frontend)  
**Performance Goals**: Sub-100ms UTXO calculations, responsive UI during commitment generation  
**Constraints**: Client-side only, no private keys server-side, offline-capable balance checks  
**Scale/Scope**: Individual user wallet interface, ~5-10 components affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacy by Default**: Implementation MUST NOT expose user private keys or create on-chain linkability - **SATISFIED**: All cryptographic operations (secret generation, commitment hashing) happen client-side
- **Hook Architecture**: Design MUST be modular and support future protocol adapters without breaking existing privacy guarantees - **SATISFIED**: UTXO math is agnostic to action type (Uniswap, Aave, etc.)
- **Economic Integrity**: All transactions MUST be atomic with proper UTXO handling and fail-safe mechanisms - **SATISFIED**: Math validates sufficient funds before transaction
- **Security Testing**: 100% branch coverage REQUIRED for all Hook logic and Merkle Tree transitions - **SATISFIED**: Unit tests required for UTXO math functions
- **Circuit Design**: Noir implementations MUST be optimized for mobile/web browser proof generation - **NOT APPLICABLE**: This is frontend logic, circuits already exist
- **Formal Verification**: Code structure MUST support future formal verification of ZK-Verifier and Vault logic - **SATISFIED**: Pure functions for UTXO math are verifiable

## Project Structure

### Documentation (this feature)

```text
specs/013-utxo-math-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output - COMPLETED
├── data-model.md        # Phase 1 output - COMPLETED
├── quickstart.md        # Phase 1 output - COMPLETED
├── contracts/           # Phase 1 output - COMPLETED
│   ├── index.ts
│   ├── note.ts
│   ├── privacy-vault.ts
│   └── commitment.ts
└── tasks.md             # Phase 2 output - NOT YET GENERATED
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── UTXOBalanceDisplay.tsx
│   │   ├── InvestmentForm.tsx
│   │   └── TransactionPreview.tsx
│   ├── hooks/
│   │   ├── useUTXOMath.ts
│   │   └── useNoteManagement.ts
│   ├── utils/
│   │   ├── utxoMath.ts
│   │   ├── commitment.ts
│   │   └── gasEstimator.ts
│   ├── types/
│   │   └── utxo.ts
│   └── services/
│       └── executeAction.ts
└── tests/
    ├── unit/
    │   ├── utxoMath.test.ts
    │   └── commitment.test.ts
    └── integration/
        └── investmentFlow.test.tsx
```

**Structure Decision**: Web application structure using Next.js App Router. UTXO math logic isolated in utils/ for testability. Hooks provide reactive state management.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Phase 0: Research - COMPLETED

### Resolved Unknowns

1. **Gas estimation strategy**: Hybrid approach using `viem.estimateContractGas()` with historical fallback (~200k gas for executeAction)
2. **Poseidon parameters**: Standard BN254 Poseidon, t=3, alpha=5 via poseidon-lite
3. **Note format**: JSON for local storage, Noir Field elements for circuits
4. **executeAction signature**: TypeScript interface matching Solidity function

### Research Output
- File: `/specs/013-utxo-math-frontend/research.md`
- Contains: Gas estimation, Poseidon config, note format, executeAction interface

## Phase 1: Design Artifacts - COMPLETED

### Generated Deliverables

| Artifact | Status | Path |
|----------|--------|------|
| research.md | ✅ Complete | `/specs/013-utxo-math-frontend/research.md` |
| data-model.md | ✅ Complete | `/specs/013-utxo-math-frontend/data-model.md` |
| contracts/ | ✅ Complete | `/specs/013-utxo-math-frontend/contracts/` |
| quickstart.md | ✅ Complete | `/specs/013-utxo-math-frontend/quickstart.md` |
| Agent context | ✅ Updated | `/home/marcos-lobo/projetos/hackathons/anonex/AGENTS.md` |

### Key Design Decisions

1. **Gas Estimation**: RPC-based with 20% buffer, historical fallback
2. **Commitment Generation**: poseidon-lite with BN254 field, t=3
3. **Note Storage**: Encrypted JSON in localStorage
4. **Action Interface**: executeAction(params) with changeCommitment

## Phase 2: Next Steps

### Implementation Tasks

1. Create `frontend/src/utils/utxoMath.ts` with calculateUTXO function
2. Create `frontend/src/utils/commitment.ts` with computeChangeCommitment
3. Create `frontend/src/utils/gasEstimator.ts` with estimateGas function
4. Create `frontend/src/hooks/useUTXOMath.ts` React hook
5. Create `frontend/src/components/InvestmentForm.tsx`
6. Create `frontend/src/components/TransactionPreview.tsx`
7. Write unit tests for utxoMath.ts and commitment.ts
8. Write integration test for investment flow
9. Run lint and typecheck

### Command to Generate Tasks

```bash
# From repository root
specs/scripts/bash/generate-tasks.sh 013-utxo-math-frontend
```
