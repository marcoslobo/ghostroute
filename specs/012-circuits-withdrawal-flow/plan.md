# Implementation Plan: Circuit Withdrawal Flow Support

**Branch**: `012-circuits-withdrawal-flow` | **Date**: 2026-02-04 | **Spec**: specs/012-circuits-withdrawal-flow/spec.md
**Input**: Update circuits/src/main.nr to support withdrawal flow with actionHash verification and balance constraints

## Summary

Modify the existing Noir ZK circuit (circuits/src/main.nr) to support withdrawals from PrivacyVault. The circuit must:
1. Verify actionHash matches H(recipient, withdraw_amount) using appropriate hash function
2. Enforce balance constraint: input_note.amount = withdraw_amount + change_note.amount
3. Maintain backward compatibility with existing investment flow

## Technical Context

**Language/Version**: Noir 1.0.0-beta.18 (via Nargo)  
**Primary Dependencies**: std::hash (Pedersen, Poseidon), std::merkle  
**Storage**: N/A (circuit only)  
**Testing**: nargo test, custom integration tests  
**Target Platform**: WASM (browser), native CLI  
**Project Type**: ZK circuit (Noir)  
**Performance Goals**: < 5s proof generation, minimal constraints for mobile  
**Constraints**: Must be compatible with existing PrivacyVault Verifier.sol  
**Scale/Scope**: Single circuit file, 2-3 new constraints  

**Open Questions (RESOLVED)**:
- Hash function for actionHash: `pedersen_hash` (consistent with existing code)
- Circuit architecture: Unified circuit with `is_withdrawal` boolean flag
- Recipient format: Field (packed Ethereum address)

## Constitution Check (Post-Phase 1 Re-evaluation)

*PASSED - All principles satisfied*

- **Privacy by Default**: ✅ actionHash binds recipient/amount without revealing which note funded
- **Hook Architecture**: ✅ Modular - same circuit for both investment and withdrawal hooks
- **Economic Integrity**: ✅ UTXO balance constraint: input_amount = withdraw_amount + change_amount
- **Security Testing**: ✅ New withdrawal tests will achieve 100% coverage for withdrawal logic
- **Circuit Design**: ✅ Minimal constraints added, unified circuit approach
- **Formal Verification**: ✅ Simple arithmetic assertions support future FV

## Project Structure

### Documentation (this feature)

```text
specs/012-circuits-withdrawal-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
circuits/
├── src/
│   └── main.nr         # Modified circuit with withdrawal support
├── Nargo.toml
├── Prover.toml
└── target/
    ├── ghostroute_privacy_circuit.json
    └── Verifier.sol (regenerated)
```

**Structure Decision**: Single circuit file modification, maintaining existing project structure.

## Complexity Tracking

> Not required - no Constitution violations
