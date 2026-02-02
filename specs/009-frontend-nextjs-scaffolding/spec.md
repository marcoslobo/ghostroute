# Feature Specification: Next.js 14+ Frontend Scaffolding & ZK-Wasm Infrastructure

**Task**: #9 | **Branch**: 009-frontend-nextjs-scaffolding | **Date**: 2026-02-02

## Objective

Initialize a new Next.js application in the apps/web directory from scratch. This includes setting up the Web3 provider stack, configuring the environment for Noir/Barretenberg Wasm binaries, and implementing the deterministic secret derivation logic.

## Technical Plan

### 1. Framework & UI Scaffolding

- Initialize Next.js 14+ using the App Router and TypeScript
- Configure Tailwind CSS for styling and ESLint/Prettier for code consistency
- Structure the project for modularity: src/components, src/hooks, src/services, and src/workers

### 2. Web3 & Multi-Transport Provider

- Install and configure Wagmi and Viem
- Integrate ConnectKit or RainbowKit for wallet connectivity
- Configure a multi-transport RPC setup (Alchemy/Infura + Public) for Sepolia to ensure high availability

### 3. ZK-Wasm Configuration

- Configure next.config.js to handle Web Workers and Wasm files correctly
- Add polyfills if necessary (e.g., buffer, process) to support low-level cryptographic libraries in the browser
- Setup the /public directory to host Noir circuit artifacts (.json) and Barretenberg Wasm files

### 4. Identity & Secret Derivation (EIP-712)

- Implement a usePrivacyIdentity hook
- Define an EIP-712 Domain and Message:
  - Domain: name: "AnonLP", version: "1", chainId: 11155111
  - Message: "Access and recover my privacy vault notes."
- Derive the Master Secret using the signature hash as a seed for HKDF (Hashed Message Authentication Code-based Key Derivation Function)

## Success Criteria (Definition of Done)

- [ ] The Next.js application builds and runs without errors
- [ ] A user can connect their wallet and sign the EIP-712 message
- [ ] The console logs a deterministic Master Secret (for dev verification)
- [ ] The environment is ready to spawn Web Workers for the Noir Prover

## Tech Stack

- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS
- Wagmi + Viem
- ConnectKit or RainbowKit
- Noir/Barretenberg (Wasm)
- EIP-712 + HKDF for secret derivation
- Web Workers for ZK proving
