# Research: Next.js 14+ Frontend Scaffolding & ZK-Wasm Infrastructure

**Branch**: 009-frontend-nextjs-scaffolding | **Date**: 2026-02-02

## Research Questions & Findings

### 1. Wagmi + Viem Multi-Transport Setup for Sepolia

**Decision**: Use Wagmi's createConfig with Viem's http transport and fallback support

**Rationale**:
- Wagmi 2.x uses Viem 2.x under the hood, providing seamless integration
- Multi-transport setup via `http()` with `fallback()` and `retry()` configurations
- Sepolia requires chainId: 11155111 in the chain configuration
- Alchemy and Infura are preferred RPC providers for mainnet/testnet reliability

**Implementation Pattern**:
```typescript
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { fallback, http } from 'viem'

const transports = {
  [sepolia.id]: fallback([
    http('https://sepolia.infura.io/v3/{INFURA_API_KEY}'),
    http('https://eth-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}'),
    http('https://rpc.sepolia.org'),
  ]),
}
```

**Alternatives considered**: Using public RPC only (rejected due to rate limiting), using WalletConnect directly (adds complexity for simple wallet connections)

### 2. ConnectKit vs RainbowKit for Wallet Connectivity

**Decision**: RainbowKit

**Rationale**:
- Better customization options and theming with Tailwind CSS
- More active maintenance and better TypeScript support
- Seamless integration with Wagmi 2.x
- Built-in support for popular wallets (MetaMask, WalletConnect, Coinbase Wallet)
- Better mobile experience out of the box

**Implementation Pattern**:
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia } from 'wagmi/chains'

const config = getDefaultConfig({
  chains: [mainnet, sepolia],
  projectId: '{WALLET_CONNECT_PROJECT_ID}',
})
```

**Alternatives considered**: ConnectKit (good but less flexible customization), web3modal (more boilerplate)

### 3. Next.js Web Workers & Wasm Configuration

**Decision**: Use Next.js built-in worker support with custom next.config.js for Wasm

**Rationale**:
- Next.js 14 supports web workers via `new Worker()` with full path resolution
- Wasm files should be placed in /public and loaded dynamically
- Need to configure webpack for Wasm loading and potential polyfills
- Buffer/process polyfills may be needed for crypto libraries

**next.config.js Configuration**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        util: require.resolve('util'),
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/wasm/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}
```

**Alternatives considered**: Using Vite (rejected to maintain Next.js ecosystem consistency)

### 4. EIP-712 Implementation for Identity Derivation

**Decision**: Use Viem's `signTypedData` with custom domain definition

**Rationale**:
- Viem provides type-safe EIP-712 signing via `signTypedData`
- EIP-712 domain must match contract expectations for verification
- ChainId 11155111 is Sepolia testnet
- Message structure: "Access and recover my privacy vault notes."

**Implementation Pattern**:
```typescript
const domain = {
  name: 'AnonLP',
  version: '1',
  chainId: 11155111,
  verifyingContract: '0x...', // Privacy Vault contract address
} as const

const message = {
  statement: 'Access and recover my privacy vault notes.',
} as const

const signature = await signTypedData({
  domain,
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    PrivacyIdentity: [{ name: 'statement', type: 'string' }],
  },
  primaryType: 'PrivacyIdentity',
  message,
})
```

### 5. HKDF-Based Master Secret Derivation

**Decision**: Use Node.js crypto module with browser-compatible implementation

**Rationale**:
- HKDF (RFC 5869) provides deterministic key derivation from arbitrary input
- Signature hash serves as the input keying material (IKM)
- Use SHA-256 as the underlying hash function
- Info parameter separates different key derivations

**Implementation Pattern**:
```typescript
import { createHash, hkdf } from 'crypto'

function deriveMasterSecret(signatureHash: string): Uint8Array {
  return hkdf(
    'sha256',
    Buffer.from(signatureHash.slice(2), 'hex'),
    '', // salt - can be empty or use application-specific salt
    'AnonLP Master Secret:v1',
    32 // output length (256 bits)
  )
}
```

**Alternatives considered**: Using Web Crypto API (more complex), using third-party libraries (adds dependency)

### 6. Noir/Barretenberg Wasm Integration

**Decision**: Load Barretenberg Wasm dynamically in Web Worker

**Rationale**:
- ZK proof generation is CPU-intensive and must run off-main-thread
- Barretenberg provides WebAssembly builds for browser execution
- Web Worker prevents UI freezing during proof generation
- Must use Cross-Origin-Opener-Policy headers for SharedArrayBuffer

**Worker Pattern**:
```typescript
// noir-prover.worker.ts
import init, { acir_read_constraints, execute_program } from '@noir-lang/noirc_vm'

self.onmessage = async ({ data: { acir, witness } }) => {
  await init()
  const result = execute_program(acir, witness)
  self.postMessage(result)
}
```

**Loading Pattern**:
```typescript
const worker = new Worker(new URL('./workers/noir-prover.worker.ts', import.meta.url), {
  type: 'module',
})
```

## Summary of Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Web3 Framework | Wagmi + Viem | Industry standard, excellent TypeScript support |
| Wallet Kit | RainbowKit | Better customization, mobile support |
| Chain | Sepolia (11155111) | Testnet for development |
| Identity | EIP-712 + HKDF | Standard-compliant, deterministic |
| ZK Proving | Barretenberg Wasm + Web Workers | Off-main-thread, browser-compatible |
| Styling | Tailwind CSS | Already in project standards |

## Next Steps

1. Initialize Next.js 14+ project in apps/web
2. Configure Tailwind CSS and ESLint/Prettier
3. Set up Wagmi/Viem with RainbowKit for Sepolia
4. Create EIP-712 domain and message types
5. Implement usePrivacyIdentity hook with HKDF derivation
6. Configure next.config.js for Wasm and workers
7. Set up /public directory for circuit artifacts
8. Create Noir prover Web Worker template
