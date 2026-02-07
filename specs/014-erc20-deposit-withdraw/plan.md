# Implementation Plan: ERC20 Deposit & Withdraw Support

**Branch**: `014-erc20-deposit-withdraw` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-erc20-deposit-withdraw/spec.md`

## Summary

Extend the existing PrivacyVault contract to support ERC20 token deposits and withdrawals alongside the current ETH-only functionality. The implementation adds: (1) a simplified `deposit()` that accepts a `token` parameter and uses `transferFrom` for ERC20 transfers, (2) a `withdrawERC20()` function that verifies ZK proofs and transfers ERC20 tokens to recipients, (3) completion of the existing `depositWithPermit()` stub to actually execute Permit2 token transfers for ERC20, and (4) SafeERC20 usage for all token interactions. The unified Merkle tree is preserved — ETH and ERC20 commitments coexist. The commitment hash binds the token address: `H(nullifier, token, amount, salt)`.

## Technical Context

**Language/Version**: Solidity ^0.8.20  
**Primary Dependencies**: OpenZeppelin Contracts (SafeERC20, IERC20), Permit2 (Uniswap canonical deployment at `0x000000000022D473030F116dDEE9F6B43aC78BA3`), existing IZKVerifier interface  
**Storage**: On-chain state — Merkle tree (simplified hash chain), nullifier mapping, commitment mapping. ERC20 balances tracked via `IERC20.balanceOf(address(this))`.  
**Testing**: Foundry (forge test) — existing test suite in `ghostroute-contracts/test/` and `ghostroute-contracts/tests/`  
**Target Platform**: EVM-compatible chains (Ethereum mainnet, Sepolia testnet)  
**Project Type**: Single project (Solidity contracts)  
**Performance Goals**: ERC20 deposit < 150k gas (simplified), < 200k gas (Permit2); ERC20 withdrawal < 250k gas  
**Constraints**: Must maintain backward compatibility with all existing ETH functions and tests. Must use SafeERC20 for non-standard tokens (USDT-style).  
**Scale/Scope**: Extends existing PrivacyVault.sol (~454 lines). Estimated additions: ~150 lines of contract code, ~300 lines of tests, supporting mock contracts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacy by Default**: PASS. ERC20 deposits produce the same commitment structure as ETH. The token address is embedded in the commitment hash (private input to ZK circuit), preventing on-chain linkability between deposit and withdrawal. No private keys or secrets are stored on-chain.
- **Hook Architecture**: PASS. ERC20 support is added to the Vault layer, not the Hook layer. The modular separation between PrivacyVault (asset custody) and PrivacyLiquidityHook (Uniswap v4 integration) is preserved. Future action adapters can leverage the multi-asset vault without modification.
- **Economic Integrity**: PASS. ERC20 withdrawals follow the same UTXO Spend+Change model as ETH. If the ERC20 transfer fails, the transaction reverts atomically — the nullifier is NOT marked as spent, and the change commitment is NOT added. SafeERC20 ensures non-reverting tokens are handled correctly.
- **Security Testing**: PASS (planned). 100% branch coverage will be required for all new ERC20 paths. Tests must cover: successful deposit/withdraw, insufficient balance, fee-on-transfer detection, non-standard return values, reentrancy via malicious tokens, and Permit2 integration.
- **Circuit Design**: N/A for this feature. The existing Noir circuit already supports a generic `actionHash` that can encode any asset type. The token address is included in the commitment and actionHash computation, which is done off-chain.
- **Formal Verification**: PASS. The new functions follow the same patterns as existing ETH functions (Checks-Effects-Interactions). State transitions are minimal and auditable. SafeERC20 wrapping adds a well-audited abstraction layer.

## Project Structure

### Documentation (this feature)

```text
specs/014-erc20-deposit-withdraw/
├── plan.md              # This file
├── research.md          # Phase 0: ERC20 patterns, Permit2 integration, SafeERC20 decisions
├── data-model.md        # Phase 1: Entity model for multi-asset vault
├── quickstart.md        # Phase 1: Setup and testing guide for ERC20 features
├── contracts/           # Phase 1: API contracts
│   └── api.md           # Function signatures, events, errors
└── tasks.md             # Phase 2 output (NOT created by plan)
```

### Source Code (repository root)

```text
ghostroute-contracts/
├── PrivacyVault.sol              # Modified: add ERC20 deposit/withdraw functions
├── interfaces/
│   └── IPrivacyVault.sol         # Modified: add ERC20 function signatures
├── libraries/
│   ├── Permit2Lib.sol            # Existing: Permit2 types and constants
│   └── BaseLib.sol               # Existing: errors and events (extend for ERC20)
├── types/
│   └── Deposit.sol               # Existing: deposit type definitions
├── mocks/
│   ├── MockZKVerifier.sol        # Existing
│   └── MockERC20.sol             # New: ERC20 mock for testing
├── test/
│   └── PrivacyVault.t.sol        # Modified: add ERC20 test cases
└── tests/
    ├── ERC20Deposit.t.sol        # New: dedicated ERC20 deposit tests
    └── ERC20Withdraw.t.sol       # New: dedicated ERC20 withdrawal tests
```

**Structure Decision**: Extends the existing `ghostroute-contracts/` project. No new projects or directories are created beyond test files and a mock ERC20 contract. The existing PrivacyVault.sol is modified in-place to add ERC20 functionality.

## Constitution Check — Post-Design Re-evaluation

*Re-evaluated after Phase 1 design completion.*

- **Privacy by Default**: PASS (confirmed). The design preserves privacy through:
  - Unified Merkle tree for ETH and ERC20 (maximizes anonymity set per constitution III).
  - Token address embedded in commitment hash (private circuit input, not visible on-chain until withdrawal).
  - Permit2 `SignatureTransfer` chosen over `AllowanceTransfer` specifically to avoid on-chain allowance state leakage.
  - `permitWitnessTransferFrom` binds commitment to signature, preventing front-running.

- **Hook Architecture**: PASS (confirmed). ERC20 support is entirely within the Vault layer. The PrivacyLiquidityHook is unchanged. Future action adapters can leverage multi-asset vault without modification.

- **Economic Integrity**: PASS (confirmed). Atomicity verified through:
  - CEI ordering: all state mutations before `safeTransfer`.
  - `nonReentrant` modifier as defense-in-depth.
  - Internal balance accounting (`tokenBalances`) prevents manipulation via direct transfers.
  - Token allowlist blocks fee-on-transfer and rebasing tokens that would break the commitment scheme.
  - If `safeTransfer` reverts, all state changes revert atomically.

- **Security Testing**: PASS (planned). Test plan includes:
  - Successful deposit/withdraw for multiple ERC20 tokens.
  - Insufficient balance, zero amount, address(0) token edge cases.
  - Non-standard token handling via SafeERC20 (USDT-style).
  - Reentrancy via malicious token contracts.
  - Permit2 integration tests.
  - Backward compatibility: all existing ETH tests must pass unchanged.

- **Circuit Design**: PASS (N/A for contract changes). The circuit already has `asset_id` in the Note struct. The actionHash extension to include `token` is a circuit-side change that should be tracked in a separate feature.

- **Formal Verification**: PASS (confirmed). New functions follow identical patterns to existing ETH functions. All state transitions are documented in data-model.md. SafeERC20 is an audited OpenZeppelin component.

**Gate Result**: ALL PASS. No violations. Proceeding to Phase 2 (task breakdown — not included in this plan).

## Complexity Tracking

> No constitution violations detected. All gates pass.
