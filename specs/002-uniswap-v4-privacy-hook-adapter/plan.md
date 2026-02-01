# Implementation Plan: Uniswap v4 Privacy Hook Adapter

**Branch**: `002-uniswap-v4-privacy-hook-adapter` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-uniswap-v4-privacy-hook-adapter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Develop a Uniswap v4 Hook that acts as a privacy-preserving liquidity adapter, enabling users to add liquidity to Uniswap v4 pools using funds from the PrivacyVault without revealing the source of funds. The hook inherits from BaseHook, implements beforeAddLiquidity with EIP-1153 transient storage validation, handles the Settle flow for atomic asset transfers, and provides actionHash computation aligned with Noir circuit public inputs.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Solidity ^0.8.20  
**Primary Dependencies**: Uniswap v4 Core (BaseHook, PoolManager), OpenZeppelin Contracts, EIP-1153 Transient Storage, @zk-kit/lean-imt.sol v2.0+ (for PrivacyVault integration)  
**Storage**: EIP-1153 Transient Storage (no persistent state - stateless hook)  
**Testing**: Foundry (forge test) with 100% branch coverage requirement  
**Target Platform**: EVM-compatible chains (Ethereum mainnet, L2s)  
**Project Type**: Single project (Solidity smart contracts)  
**Performance Goals**: Gas optimization for hook operations, <200k gas per liquidity addition  
**Constraints**: Atomic execution required, ZK-proof verification must complete within transaction, no on-chain linkability  
**Scale/Scope**: Integration with existing PrivacyVault (001), support for all Uniswap v4 pools

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacy by Default**: Implementation MUST NOT expose user private keys or create on-chain linkability
- **Hook Architecture**: Design MUST be modular and support future protocol adapters without breaking existing privacy guarantees  
- **Economic Integrity**: All transactions MUST be atomic with proper UTXO handling and fail-safe mechanisms
- **Security Testing**: 100% branch coverage REQUIRED for all Hook logic and Merkle Tree transitions
- **Circuit Design**: Noir implementations MUST be optimized for mobile/web browser proof generation
- **Formal Verification**: Code structure MUST support future formal verification of ZK-Verifier and Vault logic

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
src/
├── hooks/
│   ├── PrivacyLiquidityHook.sol    # Main Uniswap v4 hook implementation
│   └── interfaces/
│       ├── IPrivacyVault.sol       # Interface for PrivacyVault integration
│       └── IPrivacyLiquidityHook.sol
├── libraries/
│   ├── ActionHash.sol              # Library for computing actionHash
│   └── TransientStorage.sol        # EIP-1153 transient storage utilities
└── types/
    └── HookTypes.sol               # Type definitions and structs

tests/
├── hooks/
│   ├── PrivacyLiquidityHook.t.sol  # Hook unit tests
│   └── mocks/
│       ├── MockPoolManager.sol
│       └── MockPrivacyVault.sol
├── integration/
│   └── HookIntegration.t.sol       # Integration tests with PoolManager
└── fuzz/
    └── HookFuzz.t.sol              # Fuzzing tests
```

**Structure Decision**: Single Solidity project following standard Foundry structure. Hook contracts in `src/hooks/`, utility libraries in `src/libraries/`, comprehensive test suite with unit, integration, and fuzzing tests.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
