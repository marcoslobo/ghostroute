<!--
Sync Impact Report:
Version change: 1.0.0
Modified principles: All principles replaced with DeFi privacy protocol principles
Added sections: Engineering Principles, Economic Integrity, Interoperability & Modularity  
Removed sections: Generic template placeholders
Templates requiring updates: ⚠ pending (plan-template.md, spec-template.md, tasks-template.md need constitution alignment)
Follow-up TODOs: None - all placeholders filled
-->

# GhostRoute Constitution

## Core Principles

### I. Privacy by Default (Zero-Knowledge)
The protocol shall never have access to user's private keys or uncommitted secrets. No on-chain link shall exist between the funding source (Deposit) and the liquidity position (Action) without a valid Zero-Knowledge Proof. Cryptographic proofs must be generated on the user's device to ensure data sovereignty.

### II. Interoperability & Modularity (The Hook Architecture)
While initially built for Uniswap v4, the architecture must remain modular via "Action Adapters" to support future protocols (Aave, Morpho, etc.). Hooks must only serve as executors and verifiers; they shall not introduce centralized bottlenecks or backdoors.

### III. Economic Integrity (UTXO Model)
All privacy-to-DeFi interactions must be atomic. If the DeFi leg fails, the ZK-Note must remain unspent. The protocol shall support a diverse range of assets (ETH/ERC20) within a unified Merkle Tree structure to maximize the anonymity set.

## Engineering Principles

### Security-First Testing
100% branch coverage is required for all Hook logic and Merkle Tree transitions. All critical components must undergo Foundry-based testing with comprehensive edge case coverage.

### Minimalist Circuit Design
Noir circuits must be optimized for constraints to ensure fast proof generation in mobile and web browsers. Circuit complexity must be justified with performance benchmarks.

### Formal Verification Ready
Code must be written with clarity to facilitate future formal verification of the ZK-Verifier and Vault logic. All cryptographic implementations must be auditable and mathematically verifiable.

## Governance & Evolution

### Immutable Core
The ZK-Verifier and Merkle Tree logic should move towards immutability to ensure permanent privacy guarantees. Core cryptographic primitives shall be treated as protocol constants.

### Community Adapters
The community may propose new "Action Adapters," but each must undergo a rigorous security audit before being whitelisted by the Vault. All adapter proposals must include threat models and formal verification plans.

### Amendment Process
Constitutional amendments require supermajority governance approval, security audit completion, and backward compatibility analysis. All changes must preserve existing privacy guarantees and user funds.

## Governance

This constitution supersedes all other project practices and technical decisions. All implementations, code reviews, and protocol changes must verify explicit compliance with these principles. Security violations must be justified with threat model analysis and approved by governance before implementation. Use project-specific guidance documents for runtime development decisions while maintaining constitutional adherence.

**Version**: 1.0.0 | **Ratified**: 2026-01-30 | **Last Amended**: 2026-01-30