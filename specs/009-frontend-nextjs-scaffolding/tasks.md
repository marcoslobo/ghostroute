# Tasks: Next.js 14+ Frontend Scaffolding & ZK-Wasm Infrastructure

**Feature**: Next.js 14+ Frontend Scaffolding & ZK-Wasm Infrastructure
**Branch**: 009-frontend-nextjs-scaffolding | **Generated**: 2026-02-02

## User Stories

| ID | Priority | Description | Independent Test Criteria |
|----|----------|-------------|--------------------------|
| US1 | P1 | Next.js application builds and runs without errors | `npm run build` succeeds, dev server starts |
| US2 | P1 | User can connect wallet and sign EIP-712 message | Wallet modal opens, signature prompt appears |
| US3 | P1 | Console logs deterministic Master Secret | Dev console shows 32-byte master secret |
| US4 | P2 | Environment ready to spawn Web Workers for Noir Prover | Worker initialization completes without errors |

## Dependency Graph

```
Phase 1 (Setup)
    |
    v
Phase 2 (Foundational)
    |
    +---> US1 (Next.js App)
    |
    +---> US2 (Wallet Connection) ---> US3 (EIP-712 Identity)
    |
    +---> US4 (ZK Worker Infrastructure)
```

## Implementation Strategy

**MVP Scope**: US1 + US2 (Phases 1-5)
- First deliverable: Working Next.js app with wallet connection
- Identity derivation and proof worker are incremental additions

**Incremental Delivery**:
1. Phase 1-2: Foundation (blocking all stories)
2. Phase 3: US1 - Basic app structure
3. Phase 4: US2 - Wallet connection
4. Phase 5: US3 - EIP-712 identity (depends on US2)
5. Phase 6: US4 - ZK infrastructure (independent)

---

## Phase 1: Setup

**Goal**: Initialize Next.js 14+ project structure with TypeScript, Tailwind CSS, and configuration files

**Independent Test Criteria**: `cd apps/web && npm install` completes without errors

### Tasks

- [X] T001 Initialize Next.js 14+ project with TypeScript in apps/web using `npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --no-import-alias`
- [X] T002 [P] Configure tsconfig.json with strict mode, path aliases (@/*), and type checking options per implementation plan
- [X] T003 [P] Configure tailwind.config.ts with custom theme colors, typography plugin, and content paths per implementation plan
- [X] T004 [P] Create .eslintrc.json with TypeScript ESLint rules and Prettier integration
- [X] T005 [P] Create .prettierrc with consistent code formatting rules for the project
- [X] T006 Create .env.local.example with all required environment variables (INFURA_API_KEY, ALCHEMY_API_KEY, WALLET_CONNECT_PROJECT_ID, PRIVACY_VAULT_ADDRESS)
- [X] T007 [P] Create apps/anonex-ui/public/circuits/ directory for Noir circuit artifacts
- [X] T008 [P] Create apps/anonex-ui/public/wasm/ directory for Barretenberg Wasm binaries

**Phase 1 Dependencies**: None

**Parallel Execution**: T002, T003, T004, T005 can run in parallel; T007, T008 can run in parallel

---

## Phase 2: Foundational

**Goal**: Configure Web3 providers, Wagmi/RainbowKit integration, and ZK-Wasm build configuration

**Independent Test Criteria**: `npm run build` succeeds with no type errors in lib/ configuration files

### Tasks

- [X] T009 Create apps/anonex-ui/package.json with all required dependencies (wagmi, viem, @rainbow-me/rainbowkit, @noir-lang/noirc_vm, @noir-lang/barretenberg, tailwindcss, typescript, etc.)
- [X] T010 [P] Create apps/anonex-ui/src/lib/wagmi.ts with Wagmi configuration including multi-transport RPC setup (Infura + Alchemy + public RPC for Sepolia chainId 11155111)
- [X] T011 [P] Create apps/anonex-ui/src/lib/eip712.ts with EIP-712 domain definition (name: "AnonLP", version: "1", chainId: 11155111) and message types for privacy identity
- [X] T012 [P] Create apps/anonex-ui/src/lib/hkdf.ts with HKDF-SHA256 implementation for deriving Master Secret from signature hash
- [X] T014 [P] Create apps/anonex-ui/tsconfig.json paths configuration for @/* aliases to src/* paths

**Phase 2 Dependencies**: Phase 1 complete

**Parallel Execution**: T010, T011, T012, T014 can run in parallel

---

## Phase 3: User Story 1 - Next.js Application

**Goal**: Create basic Next.js application structure with layout and page components

**Independent Test Criteria**: Dev server runs at localhost:3000, page renders without errors

### Tasks

- [X] T015 Create apps/anonex-ui/src/app/layout.tsx with RootLayout component including providers wrapper for Wagmi and RainbowKit
- [X] T016 Create apps/anonex-ui/src/app/page.tsx with Home page component showing connection status and identity derivation UI
- [X] T017 Create apps/anonex-ui/src/components/ui/Button.tsx with accessible button component using Tailwind CSS
- [X] T018 [P] Create apps/anonex-ui/src/components/ui/Card.tsx with card component for grouping related content
- [X] T019 [P] Create apps/anonex-ui/src/components/ui/Input.tsx with accessible input component for forms
- [X] T020 Create apps/anonex-ui/src/components/Providers.tsx with WagmiProvider and RainbowKitProvider wrappers for app layout

**Phase 3 Dependencies**: Phase 2 complete (uses wagmi.ts, eip712.ts, hkdf.ts)

**Parallel Execution**: T017, T018, T019 can run in parallel

---

## Phase 4: User Story 2 - Wallet Connection

**Goal**: Implement wallet connection UI and hooks using RainbowKit

**Independent Test Criteria**: Clicking "Connect Wallet" opens RainbowKit modal, wallet connection succeeds

### Tasks

- [X] T021 Create apps/anonex-ui/src/hooks/useWallet.ts with useWallet hook exposing connect, disconnect, isConnected, address, chainId state
- [X] T022 Create apps/anonex-ui/src/components/wallet/WalletButton.tsx with Connect/Disconnect button using RainbowKit's useConnectModal hook
- [X] T023 Create apps/anonex-ui/src/components/wallet/WalletStatus.tsx with component displaying current connection status, address, and chain information
- [X] T024 [P] Create apps/anonex-ui/src/components/wallet/NetworkSelector.tsx with network switcher component for Sepolia/Mainnet
- [X] T025 Update apps/anonex-ui/src/app/page.tsx to include WalletButton and WalletStatus components

**Phase 4 Dependencies**: Phase 3 complete (uses UI components, Providers)

**Parallel Execution**: T021, T022, T023, T024 can run in parallel

---

## Phase 5: User Story 3 - EIP-712 Identity Derivation

**Goal**: Implement EIP-712 signature flow and HKDF-based Master Secret derivation

**Independent Test Criteria**: After wallet connection, signing message logs deterministic 32-byte Master Secret to console

### Tasks

- [X] T026 Create apps/anonex-ui/src/hooks/usePrivacyIdentity.ts with usePrivacyIdentity hook exposing deriveIdentity, isAuthenticated, masterSecret, signatureHash state
- [X] T027 [P] Implement signTypedData call in usePrivacyIdentity using Viem's signTypedData with EIP-712 domain and PrivacyIdentity message type
- [X] T028 [P] Implement HKDF derivation in usePrivacyIdentity using lib/hkdf.ts to generate 32-byte Master Secret from signature hash
- [X] T029 Create apps/anonex-ui/src/components/privacy/IdentitySection.tsx with UI for requesting EIP-712 signature and displaying Master Secret
- [X] T030 Create apps/anonex-ui/src/components/privacy/SignatureDisplay.tsx with component to display signature hash and derived secret (dev mode only)
- [X] T031 Update apps/anonex-ui/src/app/page.tsx to include IdentitySection component
- [X] T032 Log Master Secret to console in usePrivacyIdentity hook for dev verification per success criteria

**Phase 5 Dependencies**: Phase 4 complete (requires connected wallet address)

**Parallel Execution**: T027, T028 can run in parallel; T029, T030 can run in parallel

---

## Phase 6: User Story 4 - ZK Worker Infrastructure

**Goal**: Configure Web Worker environment for Noir/Barretenberg Wasm proof generation

**Independent Test Criteria**: Web Worker initializes without errors, SharedArrayBuffer support confirmed

### Tasks

- [ ] T033 Create apps/anonex-ui/src/workers/noir-prover.worker.ts with Noir Prover Web Worker template for loading Barretenberg Wasm and executing proofs
- [ ] T034 Create apps/anonex-ui/src/hooks/useProver.ts with useProver hook exposing submitJob, getJobStatus, startWorker, isProcessing state
- [ ] T035 [P] Create apps/anonex-ui/src/components/privacy/ProverStatus.tsx with UI displaying worker status and proof job progress
- [ ] T036 [P] Create apps/anonex-ui/src/services/prover.ts with prover service for managing Web Worker lifecycle and job queue
- [ ] T037 Update apps/anonex-ui/next.config.js to ensure proper Web Worker bundling and SharedArrayBuffer headers
- [ ] T038 Create apps/anonex-ui/public/.gitkeep placeholder files in circuits/ and wasm/ directories for future artifact placement

**Phase 6 Dependencies**: Phase 3 complete (independent of wallet/identity)

**Parallel Execution**: T033, T034, T035, T036 can run in parallel

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Code quality, error handling, and documentation improvements

### Tasks

- [ ] T039 Create apps/anonex-ui/src/lib/utils.ts with helper functions (address formatting, error handling, validation)
- [ ] T040 [P] Add error boundaries and loading states to all components
- [ ] T041 [P] Create apps/anonex-ui/src/app/globals.css with Tailwind directives and custom CSS variables
- [ ] T042 Create apps/anonex-ui/.env.local template with placeholder values and documentation comments
- [ ] T043 Create apps/anonex-ui/README.md with setup instructions, environment variable documentation, and testing commands
- [ ] T044 [P] Add type exports to all lib/ files for better IDE support
- [ ] T045 [P] Create apps/anonex-ui/tests/unit/lib/hkdf.test.ts with unit tests for HKDF derivation function

**Phase 7 Dependencies**: All previous phases complete

**Parallel Execution**: T039, T040, T041, T042, T044, T045 can run in parallel

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 45 |
| Setup Phase | 8 |
| Foundational Phase | 6 |
| US1 (Next.js App) | 6 |
| US2 (Wallet Connection) | 5 |
| US3 (EIP-712 Identity) | 7 |
| US4 (ZK Worker) | 6 |
| Polish Phase | 7 |
| Parallelizable Tasks | 24 (53%) |

## Parallel Execution Examples

**Phase 1**: T002, T003, T004, T005 run in parallel (configuration files)

**Phase 2**: T010, T011, T012, T014 run in parallel (lib files)

**Phase 4**: T021, T022, T023, T024 run in parallel (wallet components)

**Phase 5**: T027, T028 run in parallel (signature + HKDF); T029, T030 run in parallel (privacy components)

**Phase 6**: T033, T034, T035, T036 run in parallel (prover infrastructure)

## Testing Strategy

Per Constitution requirements:
- Unit tests for cryptographic operations (HKDF)
- Integration tests for wallet connection flow
- E2E tests for complete user journey (connect -> sign -> derive)

Run tests with:
```bash
cd apps/web
npm run test        # Unit tests
npm run test:watch  # Watch mode
npm run build       # Verify production build
```
