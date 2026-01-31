# Implementation Plan: PrivacyVault

**Branch**: `001-privacy-vault` | **Date**: 2026-01-30 | **Spec**: [specs/001-privacy-vault/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-privacy-vault/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implementation of PrivacyVault.sol with incremental Merkle Tree (height 20) supporting ETH/ERC20 deposits via Permit2. Focus on gas-efficient insertLeaf function and Foundry-based comprehensive testing to ensure privacy guarantees and constitutional compliance.

## Technical Context

**Language/Version**: Solidity ^0.8.20  
**Primary Dependencies**: OpenZeppelin Contracts, Permit2, @zk-kit/lean-imt.sol v2.0+  
**Storage**: Ethereum blockchain storage (on-chain Merkle Tree state)  
**Testing**: Foundry framework with 100% branch coverage requirement  
**Target Platform**: Ethereum EVM compatible chains  
**Project Type**: Smart contract single project  
**Performance Goals**: insertLeaf function < 100k gas, support 1M+ leaves  
**Constraints**: Constitutional privacy compliance, atomic execution, zero linkability  
**Scale/Scope**: Merkle Tree height 20 (~1M leaves), multi-asset support

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Privacy by Default**: IMPLEMENTED - Zero-knowledge commitment/nullifier pattern prevents on-chain linkability
✅ **Hook Architecture**: IMPLEMENTED - Modular design supports future protocol adapters without breaking privacy
✅ **Economic Integrity**: IMPLEMENTED - Atomic deposit handling with fail-safe mechanisms
✅ **Security Testing**: PLANNED - Foundry framework configured for 100% branch coverage requirement
✅ **Circuit Design**: PLANNED - @zk-kit/lean-imt.sol v2.0+ optimized for ZK proof generation
✅ **Formal Verification**: IMPLEMENTED - Clear, auditable code structure facilitates future formal verification

**Constitutional Compliance Status**: ✅ ALL GATES PASSED

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── PrivacyVault.sol          # Main vault contract
├── interfaces/
│   ├── IPrivacyVault.sol     # Vault interface
│   └── IMerkleTree.sol       # Merkle tree interface
├── libraries/
│   ├── LeanIMT.sol           # Incremental Merkle tree
│   └── Poseidon.sol          # ZK-friendly hash function
└── types/
    └── Deposit.sol           # Struct definitions

tests/
├── PrivacyVault.t.sol        # Main contract tests
├── Permit2.t.sol             # Permit2 integration tests
├── MerkleTree.t.sol          # Merkle tree tests
└── integration/
    └── PrivacyVaultIntegration.t.sol  # Full workflow tests
```

**Structure Decision**: Smart contract single project with dedicated libraries and interfaces for modularity and constitutional compliance.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
