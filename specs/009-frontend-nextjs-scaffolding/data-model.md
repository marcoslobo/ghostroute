# Data Model: Next.js 14+ Frontend Scaffolding & ZK-Wasm Infrastructure

**Branch**: 009-frontend-nextjs-scaffolding | **Date**: 2026-02-02

## Entities

### PrivacyIdentity

Represents the user's cryptographic identity derived from wallet signature.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| id | string (UUID) | Yes | UUID v4 | Unique identity identifier |
| address | string | Yes | EIP-55 checksum | User's Ethereum wallet address |
| masterSecret | Uint8Array | Yes | 32 bytes | Derived master secret (never stored) |
| signatureHash | string | Yes | 66 chars (0x + 64 hex) | Hash of EIP-712 signature |
| createdAt | Date | Yes | ISO 8601 | Identity creation timestamp |
| chainId | number | Yes | Positive integer | Network chain ID (11155111 for Sepolia) |

**Relationships**: One-to-many with PrivacyVault (one identity can have multiple vaults)

### WalletConnection

Manages wallet connection state and provider information.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| id | string | Yes | Auto-generated | Connection session ID |
| address | string | Yes | EIP-55 checksum | Connected wallet address |
| chainId | number | Yes | Valid chain ID | Current network chain ID |
| provider | string | Yes | Enum: 'metamask', 'walletconnect', 'coinbase' | Wallet provider type |
| status | string | Yes | Enum: 'connecting', 'connected', 'disconnected' | Connection status |
| connectedAt | Date | Yes | ISO 8601 | Connection timestamp |

### ZKProofJob

Represents an asynchronous ZK proof generation job.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| id | string (UUID) | Yes | UUID v4 | Job identifier |
| status | string | Yes | Enum: 'pending', 'processing', 'completed', 'failed' | Job status |
| circuitType | string | Yes | Enum: 'deposit', 'withdraw', 'transfer' | Type of ZK circuit |
| input | object | Yes | Circuit-specific | Proof input parameters |
| result | object | No | - | Proof output (when completed) |
| error | string | No | - | Error message (when failed) |
| createdAt | Date | Yes | ISO 8601 | Job creation timestamp |
| completedAt | Date | No | ISO 8601 | Job completion timestamp |

## State Transitions

### PrivacyIdentity State

```
Created -> Active -> Revoked
```

- **Created**: Identity derived from wallet signature
- **Active**: Identity is available for signing operations
- **Revoked**: Identity has been invalidated (user disconnected)

### ZKProofJob State

```
Pending -> Processing -> Completed
                |
                v
            Failed
```

## Validation Rules

### EIP-712 Signature Validation

- Domain name must be "AnonLP"
- Domain version must be "1"
- Domain chainId must match current network
- Message statement must be exactly: "Access and recover my privacy vault notes."

### Master Secret Derivation

- Input must be valid 66-character hex string (0x prefix + 64 hex chars)
- Output must be exactly 32 bytes (256 bits)
- Derivation must use HKDF-SHA256

## Configuration Types

### EIP712Domain

```typescript
type EIP712Domain = {
  name: 'AnonLP'
  version: '1'
  chainId: 11155111
  verifyingContract: `0x${string}`
}
```

### EIP712Message

```typescript
type PrivacyIdentityMessage = {
  statement: 'Access and recover my privacy vault notes.'
}
```

### WagmiConfig

```typescript
type WagmiConfig = {
  chains: [typeof sepolia, typeof mainnet]
  transports: {
    [chainId]: http() | fallback()
  }
  projectId: string // WalletConnect project ID
  appName: string
}
```

## Local Storage Schema

```typescript
interface LocalStorageSchema {
  'anonlp.wallet.lastConnected': string // address
  'anonlp.privacy.identity': string // encrypted JSON
  'anonlp.prover.workers': number // worker count preference
}
```
