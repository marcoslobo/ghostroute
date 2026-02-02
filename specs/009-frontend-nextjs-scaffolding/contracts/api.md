# API Contracts: Frontend Services

**Branch**: 009-frontend-nextjs-scaffolding | **Date**: 2026-02-02

## Wallet Connection Service

### Connect Wallet

**Endpoint**: `wallet:connect()`

**Method**: Client-side function

**Request Parameters**:
```typescript
{
  provider?: 'metamask' | 'walletconnect' | 'coinbase'
}
```

**Response**:
```typescript
{
  success: boolean
  address: `0x${string}`
  chainId: number
  provider: string
  error?: string
}
```

### Disconnect Wallet

**Endpoint**: `wallet:disconnect()`

**Method**: Client-side function

**Response**:
```typescript
{
  success: boolean
}
```

### Get Wallet State

**Endpoint**: `wallet:getState()`

**Method**: Client-side hook (useWallet)

**Response**:
```typescript
{
  isConnected: boolean
  address?: `0x${string}`
  chainId?: number
  isConnecting: boolean
}
```

## Privacy Identity Service

### Request Identity Signature

**Endpoint**: `privacy:requestSignature()`

**Method**: Client-side function

**Response**:
```typescript
{
  success: boolean
  signature?: `0x${string}`
  address?: `0x${string}`
  error?: string
}
```

**EIP-712 Data**:
```typescript
const EIP712_DOMAIN = {
  name: 'AnonLP',
  version: '1',
  chainId: 11155111,
  verifyingContract: '0x0000000000000000000000000000000000000000'
}

const EIP712_MESSAGE = {
  statement: 'Access and recover my privacy vault notes.'
}
```

### Derive Master Secret

**Endpoint**: `privacy:deriveMasterSecret(signatureHash: string)`

**Method**: Client-side function

**Request**:
```typescript
{
  signatureHash: `0x${string}` // 66 chars
}
```

**Response**:
```typescript
{
  success: boolean
  masterSecret?: Uint8Array // 32 bytes
  error?: string
}
```

### Get Identity State

**Endpoint**: `privacy:getIdentity()`

**Method**: Client-side hook (usePrivacyIdentity)

**Response**:
```typescript
{
  isAuthenticated: boolean
  address?: `0x${string}`
  masterSecret?: Uint8Array
  isDeriving: boolean
}
```

## ZK Proving Service

### Submit Proof Job

**Endpoint**: `prover:submitJob(circuitType: string, input: object)`

**Method**: Client-side function

**Request**:
```typescript
{
  circuitType: 'deposit' | 'withdraw' | 'transfer'
  input: {
    // Circuit-specific input parameters
    commitment: `0x${string}`
    nullifier: `0x${string}`
    // ... additional inputs
  }
}
```

**Response**:
```typescript
{
  success: boolean
  jobId: string
  error?: string
}
```

### Get Job Status

**Endpoint**: `prover:getJobStatus(jobId: string)`

**Method**: Client-side function

**Response**:
```typescript
{
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    proof: `0x${string}`
    publicInputs: `0x${string}`[]
  }
  error?: string
}
```

### Start Prover Worker

**Endpoint**: `prover:startWorker()`

**Method**: Client-side function

**Response**:
```typescript
{
  success: boolean
  workerId: string
}
```

## RPC Provider Service

### Get Sepolia Provider

**Endpoint**: `rpc:getProvider()`

**Method**: Viem client

**Configuration**:
```typescript
const transport = fallback([
  http('https://sepolia.infura.io/v3/{INFURA_API_KEY}'),
  http('https://eth-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}'),
  http('https://rpc.sepolia.org'),
])
```

## Webhook Events

### Event Bus

```typescript
// Using eventemitter3 or similar
emitter.on('wallet:connected', (address: `0x${string}`) => {})
emitter.on('wallet:disconnected', () => {})
emitter.on('identity:derived', (identity: PrivacyIdentity) => {})
emitter.on('prover:job:started', (jobId: string) => {})
emitter.on('prover:job:completed', (jobId: string, result: ProofResult) => {})
emitter.on('prover:job:failed', (jobId: string, error: string) => {})
```
