# Data Model: Webhook Payload Processor

## Entities

### WebhookPayload

Represents the incoming JSON payload from the EVM listener.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| TransactionHash | string | Yes | Ethereum transaction hash (66 chars with 0x prefix) |
| LogIndex | number | Yes | Log index within the transaction |
| ContractAddress | string | Yes | Vault contract address (42 chars with 0x prefix) |
| BlockchainNetworkId | number | Yes | Chain identifier (e.g., 1 for Ethereum mainnet) |
| DecodedParametersNames | string[] | Yes | Array of parameter names |
| DecodedParametersValues | unknown[] | Yes | Array of corresponding parameter values |
| BlockNumber | number | No | Block where event was emitted |
| BlockHash | string | No | Block hash for additional verification |
| EventSignature | string | No | Event signature hash |

### DecodedParamsMap

Dynamic key-value mapping created from DecodedParametersNames and DecodedParametersValues.

| Field | Type | Description |
|-------|------|-------------|
| [key: string] | unknown | Dynamic properties based on parameter names |

### ProcessedEvent

Database record for idempotency tracking.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| transaction_hash | VARCHAR(66) | PRIMARY KEY (with log_index) | Ethereum transaction hash |
| log_index | INTEGER | PRIMARY KEY (with transaction_hash) | Log index within transaction |
| vault_address | VARCHAR(42) | INDEX | Vault contract address |
| chain_id | INTEGER | INDEX | Chain identifier |
| event_type | VARCHAR(50) | Event categorization (Deposit/ActionExecuted) |
| commitment | VARCHAR(66) | NULLABLE | Commitment hash if applicable |
| leaf_index | INTEGER | NULLABLE | Merkle tree leaf index if applicable |
| nullifier_hash | VARCHAR(66) | NULLABLE | Nullifier hash for spent notes |
| change_commitment | VARCHAR(66) | NULLABLE | Change commitment if applicable |
| change_index | INTEGER | NULLABLE | Change leaf index if applicable |
| processed_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Processing timestamp |
| raw_payload | JSONB | NULLABLE | Original payload for debugging |

### MerkleTreeLeaf

Represents a leaf in the privacy vault Merkle tree.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| vault_address | VARCHAR(42) | INDEX, FK | Associated vault |
| chain_id | INTEGER | INDEX | Chain identifier |
| leaf_index | INTEGER | UNIQUE (with vault_address, chain_id) | Position in Merkle tree |
| commitment | VARCHAR(66) | UNIQUE | Commitment hash |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Insertion timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Whether leaf is still in tree |
| spent_at | TIMESTAMP WITH TIME ZONE | NULLABLE | When note was spent |

## Validation Rules

### WebhookPayload Validation

```typescript
interface WebhookPayload {
  TransactionHash: { type: 'string', length: 66, pattern: /^0x[0-9a-fA-F]{64}$/ },
  LogIndex: { type: 'number', min: 0 },
  ContractAddress: { type: 'string', length: 42, pattern: /^0x[0-9a-fA-F]{40}$/ },
  BlockchainNetworkId: { type: 'number', min: 0 },
  DecodedParametersNames: { type: 'array', minLength: 1 },
  DecodedParametersValues: { type: 'array', minLength: 1 },
}
```

### Idempotency Check Rules

1. TransactionHash MUST be present and valid (66 chars, 0x prefix)
2. LogIndex MUST be non-negative integer
3. Combination (TransactionHash, LogIndex) MUST be unique in processed_events table
4. Duplicate processing MUST return existing result without re-processing

### Merkle Update Rules

1. Deposit Event:
   - Requires `commitment` in decoded parameters
   - Requires `leafIndex` in decoded parameters
   - leaf_index MUST NOT already exist in MerkleTreeLeaf for this vault/chain

2. ActionExecuted Event:
   - Requires `nullifierHash` in decoded parameters (for invalidation)
   - Requires `changeCommitment` in decoded parameters
   - Requires `changeIndex` in decoded parameters
   - nullifierHash MUST mark existing note as spent

## State Transitions

```
Webhook Received
    ↓
Validate Payload Structure
    ↓
Create DecodedParamsMap
    ↓
Check Idempotency (TransactionHash + LogIndex)
    ↓
[If already processed → Return cached result]
    ↓
Determine Event Type
    ↓
[If Deposit] → Insert MerkleTreeLeaf with commitment + leafIndex
    ↓
[If ActionExecuted] → 
    1. Mark old note as spent (via nullifierHash)
    2. Insert new UTXO (changeCommitment + changeIndex)
    ↓
Record ProcessedEvent
    ↓
Return Processing Result
```

## Relationships

- ProcessedEvent 1:1 WebhookPayload (via transaction_hash + log_index)
- MerkleTreeLeaf N:1 Vault (via vault_address + chain_id)
- MerkleTreeLeaf 1:1 ProcessedEvent (for deposit events)
