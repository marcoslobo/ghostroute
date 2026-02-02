# Implementation Plan: Next.js 14+ Frontend Scaffolding & ZK-Wasm Infrastructure

**Branch**: `009-frontend-nextjs-scaffolding` | **Date**: 2026-02-02 | **Spec**: [link](/home/marcos-lobo/projetos/hackathons/anonex/specs/009-frontend-nextjs-scaffolding/spec.md)
**Input**: Feature specification from `/specs/009-frontend-nextjs-scaffolding/spec.md`

## Summary

Initialize a Next.js 14+ application in apps/web with Web3 provider stack (Wagmi/Viem), wallet connectivity (ConnectKit/RainbowKit), multi-transport RPC for Sepolia, and ZK-Wasm infrastructure for Noir/Barretenberg. Implement EIP-712 identity hook with HKDF-based Master Secret derivation for privacy vault access.

## Technical Context

**Language/Version**: TypeScript 5.x + Next.js 14+ (App Router) + Node.js 20 LTS
**Primary Dependencies**: Wagmi ^2.x, Viem ^2.x, ConnectKit ^1.x (or RainbowKit ^1.x), @noir-lang/noirc_vm ^0.x (Wasm), @noir-lang/barretenberg ^2.x (Wasm)
**Storage**: Client-side only (localStorage for cached identity), /public for static circuit artifacts
**Testing**: Jest + React Testing Library, Vitest for workers, Playwright for E2E
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge) with WebAssembly support
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: <3s initial load, <500ms wallet connection, off-main-thread ZK proof generation via Web Workers
**Constraints**: Must work without server-side private keys, no on-chain linkability between wallet and ZK proofs, offline-capable ZK proving
**Scale/Scope**: Single-page app with modular architecture, preparing for future expansion to multiple DeFi integrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Design Evaluation** (Phase 0):
- **Privacy by Default**: ✅ PASS - Wallet private keys never leave browser, EIP-712 signature only provides hash for HKDF derivation
- **Hook Architecture**: ✅ PASS - Modular Action Adapter pattern prepared for future DeFi integrations
- **Economic Integrity**: ✅ PASS - Client-side proof generation ensures atomic transactions
- **Security Testing**: ✅ PASS - Jest + React Testing Library + Playwright for full coverage
- **Circuit Design**: ✅ PASS - Web Worker-based proving prevents UI blocking, optimized for browser Wasm
- **Formal Verification**: ✅ PASS - Clean modular architecture supports future FV of ZK logic

**Post-Design Evaluation** (Phase 1):
All constitutional principles verified and compliant. No violations requiring complexity tracking.

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
apps/anonex-ui/
├── public/
│   ├── circuits/              # Noir circuit artifacts (.json)
│   └── wasm/                  # Barretenberg Wasm binaries
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── wallet/            # Wallet connection components
│   │   └── privacy/           # Privacy vault components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWallet.ts
│   │   └── usePrivacyIdentity.ts
│   ├── lib/                   # Utilities and configurations
│   │   ├── wagmi.ts
│   │   ├── eip712.ts
│   │   └── hkdf.ts
│   ├── services/              # API and external services
│   └── workers/               # Web Workers for ZK proving
│       └── noir-prover.worker.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Structure Decision**: Web application with Next.js App Router. Project will be located at `apps/web` directory with modular architecture separating components, hooks, services, and ZK proving workers.

```text
apps/anonex-ui/
├── public/
│   ├── circuits/              # Noir circuit artifacts (.json)
│   └── wasm/                  # Barretenberg Wasm binaries
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── wallet/            # Wallet connection components
│   │   └── privacy/           # Privacy vault components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWallet.ts
│   │   └── usePrivacyIdentity.ts
│   ├── lib/                   # Utilities and configurations
│   │   ├── wagmi.ts
│   │   ├── eip712.ts
│   │   └── hkdf.ts
│   ├── services/              # API and external services
│   └── workers/               # Web Workers for ZK proving
│       └── noir-prover.worker.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
