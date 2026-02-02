# Quickstart: Next.js 14+ Frontend & ZK-Wasm Infrastructure

**Branch**: 009-frontend-nextjs-scaffolding | **Date**: 2026-02-02

## Prerequisites

- Node.js 20 LTS or later
- npm, yarn, or pnpm
- MetaMask or other Web3 wallet
- Sepolia ETH for testing

## Installation

```bash
# Navigate to project directory
cd apps/web

# Install dependencies
npm install

# or with pnpm
pnpm install

# or with yarn
yarn install
```

## Environment Variables

Create a `.env.local` file in `apps/web/` directory:

```env
# RPC Providers (at least one required)
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# WalletConnect (for RainbowKit)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Contract Addresses (deployed on Sepolia)
NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=0x...

# Feature Flags
NEXT_PUBLIC_ENABLE_ZK_PROVING=true
NEXT_PUBLIC_NETWORK=sepolia
```

## Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
apps/web/
├── public/
│   ├── circuits/       # Noir circuit artifacts
│   └── wasm/          # Barretenberg binaries
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   │   ├── useWallet.ts
│   │   └── usePrivacyIdentity.ts
│   ├── lib/           # Utilities
│   │   ├── wagmi.ts
│   │   ├── eip712.ts
│   │   └── hkdf.ts
│   └── workers/       # Web Workers
│       └── noir-prover.worker.ts
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Key Features

### 1. Wallet Connection

```typescript
import { useWallet } from '@/hooks/useWallet'

function WalletButton() {
  const { connect, disconnect, isConnected, address } = useWallet()

  return (
    <button onClick={isConnected ? disconnect : connect}>
      {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
    </button>
  )
}
```

### 2. Privacy Identity (EIP-712 + HKDF)

```typescript
import { usePrivacyIdentity } from '@/hooks/usePrivacyIdentity'

function IdentitySection() {
  const { deriveIdentity, isAuthenticated, masterSecret } = usePrivacyIdentity()

  const handleSign = async () => {
    await deriveIdentity()
  }

  return (
    <div>
      <button onClick={handleSign}>Sign & Derive Identity</button>
      {isAuthenticated && (
        <pre>Master Secret: {Array.from(masterSecret!).join(', ')}</pre>
      )}
    </div>
  )
}
```

### 3. ZK Proof Generation

```typescript
import { useProver } from '@/hooks/useProver'

function ProofSection() {
  const { submitJob, getJobStatus, isProcessing } = useProver()

  const handleGenerateProof = async () => {
    const jobId = await submitJob('deposit', {
      commitment: '0x...',
      nullifier: '0x...',
    })

    const result = await getJobStatus(jobId)
    console.log('Proof:', result)
  }

  return (
    <button onClick={handleGenerateProof} disabled={isProcessing}>
      {isProcessing ? 'Generating Proof...' : 'Generate ZK Proof'}
    </button>
  )
}
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Building for Production

```bash
npm run build
npm run start
```

## Troubleshooting

### Wasm Loading Errors

Ensure COOP/COEP headers are configured in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ]
}
```

### Wallet Connection Issues

1. Check that MetaMask is installed
2. Verify you're on Sepolia network
3. Ensure environment variables are set correctly
4. Check browser console for specific errors

### Build Failures

1. Clear `.next` cache: `rm -rf apps/web/.next`
2. Reinstall dependencies: `rm -rf apps/web/node_modules && npm install`
3. Check TypeScript errors: `npm run type-check`
