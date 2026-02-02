# Data Model: Webhook Consumer for ZK Indexing

## Entities

### Vault
Represents a privacy vault on a specific chain that maintains a Merkle Tree of commitments.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Auto-generated vault identifier |
| chainId | INTEGER | NOT NULL | EVM chain ID (e.g., 1 for Ethereum mainnet) |
| vaultAddress | VARCHAR(42) | NOT NULL, CHECK (starts with '0x') | Vault contract address |
| currentRoot | VARCHAR(66) | NULLABLE | Current Merkle root hash |
| latestBlockNumber | BIGINT | NOT NULL | Latest processed block number |
| createdAt | TIMESTAMP | DEFAULT NOW() | Vault creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Relationships**:
- One-to-many with `MerkleNode`
- One-to-many with `ProcessedEvent`

---

### MerkleNode
Stores nodes of the sparse Merkle Tree for each vault.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| vaultId | UUID | FK → Vault.id, PK part | Reference to vault |
| level | INTEGER | 0-20, PK part | Tree level (0 = leaves, 20 = root) |
| index | BIGINT | PK part | Position in the level |
| hash | VARCHAR(66) | NOT NULL | Node hash value (Poseidon output) |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Node update timestamp |

**Constraints**:
- Primary Key: `(vaultId, level, index)`
- Index on `(vaultId, level)` for fast lookups

---

### ProcessedEvent
Tracks processed webhook events for idempotency.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Auto-generated event ID |
| vaultId | UUID | FK → Vault.id | Reference to vault |
| eventType | VARCHAR(50) | NOT NULL | Event type: `NewCommitment` or `NullifierSpent` |
| eventId | VARCHAR(100) | NOT NULL | External event identifier |
| blockNumber | BIGINT | NOT NULL | Block where event was emitted |
| commitmentHash | VARCHAR(66) | NULLABLE | Commitment hash (for NewCommitment) |
| nullifierHash | VARCHAR(66) | NULLABLE | Nullifier hash (for NullifierSpent) |
| processedAt | TIMESTAMP | DEFAULT NOW() | Processing timestamp |
| status | VARCHAR(20) | DEFAULT 'confirmed' | Status: `pending`, `confirmed`, `reverted` |

**Constraints**:
- Primary Key: `(vaultId, eventId)`
- Index on `(vaultId, blockNumber)` for reorg handling
- Index on `eventType` for event filtering

---

## Webhook Payloads

### NewCommitment Event
```typescript
interface NewCommitmentPayload {
  eventId: string;           // Unique event identifier
  chainId: number;           // EVM chain ID
  vaultAddress: string;      // Vault contract address
  commitment: {
    hash: string;            // Poseidon hash of commitment
    index: bigint;           // Leaf index in Merkle Tree
    value: bigint;           // Commitment value (for accounting)
    metadata: string;        // Additional metadata
  };
  block: {
    number: number;          // Block number
    hash: string;            // Block hash (for verification)
    timestamp: number;       // Block timestamp
  };
  transactionHash: string;   // Emitting transaction
}
```

### NullifierSpent Event
```typescript
interface NullifierSpentPayload {
  eventId: string;           // Unique event identifier
  chainId: number;           // EVM chain ID
  vaultAddress: string;      // Vault contract address
  nullifier: {
    hash: string;            // Nullifier hash (for double-spend prevention)
    commitmentIndex: bigint; // Index of spent commitment
  };
  block: {
    number: number;          // Block number
    hash: string;            // Block hash (for verification)
    timestamp: number;       // Block timestamp
  };
  transactionHash: string;   // Emitting transaction
}
```

---

## API Response Types

### Merkle Path Response
```typescript
interface MerklePathResponse {
  vaultId: string;
  leafIndex: number;
  root: string;
  path: {
    side: 'left' | 'right';
    hash: string;
    level: number;
  }[];
  proofGeneratedAt: string;
}
```

### Health Check Response
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  checks: {
    database: boolean;
    merkleTree: boolean;
  };
  uptime: number;
}
```

---

## State Transitions

### Vault State
```
CREATED → (first commitment) → ACTIVE → (reorg detected) → REVERTING → ACTIVE
                                      ↓
                              (chain finality) → FINALIZED
```

### Event Processing State
```
RECEIVED → VALIDATING → PROCESSING → CONFIRMED
                 ↓                              ↓
            REJECTED ← (failure) ← RETRYING ← REVERTED (reorg)
```

---

## Validation Rules

1. **Vault isolation**: All operations must include valid `chainId` and `vaultAddress`
2. **Block ordering**: Events must be processed in ascending block number per vault
3. **Idempotency**: Same `eventId` for same vault must not cause duplicate processing
4. **Nullifier uniqueness**: Same `nullifierHash` cannot be spent twice (database constraint)
5. **Commitment ordering**: New commitments must be appended at next available leaf index

---

## Supabase Integration

### Row Level Security (RLS)

Enable RLS for data protection:

```sql
-- Enable RLS on tables
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

-- Policies (restrict to service role for Edge Functions)
CREATE POLICY "Service role full access" ON vaults
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON merkle_nodes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON processed_events
  FOR ALL USING (auth.role() = 'service_role');
```

### Database Client (Edge Functions)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
```
