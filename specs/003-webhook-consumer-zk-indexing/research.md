# Research: Webhook Consumer for ZK Indexing

## Decision: Poseidon Hashing Library

**Choice**: `poseidon-lite` with `scroll-tech/poseidon-bn254` for circuit compatibility

**Rationale**:
- `poseidon-lite` is a lightweight TypeScript implementation optimized for performance
- `scroll-tech/poseidon-bn254` provides BN254-specific Poseidon hash matching Ethereum/Noir circuits
- Both libraries use BigInt for field arithmetic, ensuring compatibility with Noir's constraints
- Alternative: `@zk-kit/poseidon-cipher` (larger, includes encryption) - rejected for being overkill

**Alternatives evaluated**:
- `poseidon-encryption`: Includes encryption, unnecessary overhead
- `noble-curves`: More general elliptic curve library, not Poseidon-specific
- `poseidon-goldilocks`: Uses different field (not BN254), incompatible

---

## Decision: Merkle Tree Implementation

**Choice**: Sparse Merkle Tree (SMT) using `@zk-kit/smt` with custom hash wrapper

**Rationale**:
- Height 20 tree = ~1M possible leaves, but actual commitments will be sparse
- SMT stores only populated leaves, reducing DB storage significantly
- `@zk-kit/smt` provides TypeScript-native implementation with verification support
- Supports non-membership proofs for nullifier verification
- Custom hash wrapper ensures Poseidon compatibility with Noir circuit

**Alternatives evaluated**:
- Dense Merkle Tree: Would require ~1M node records even with few commitments
- Custom implementation: More control but higher maintenance cost
- `celestiaorg/smt`: Go-based, not TypeScript-native

---

## Decision: Webhook Delivery Model

**Choice**: At-least-once delivery with database-level idempotency

**Rationale**:
- External EVM listener likely provides at-least-once semantics
- Composite idempotency key: `chainId:vaultAddress:eventId:blockNumber`
- Database unique constraint prevents duplicate processing
- On duplicate: return success without reprocessing (idempotent behavior)
- Processing failures delete idempotency record for retry

**Implementation pattern**:
```
INSERT INTO processed_events (idempotency_key) VALUES ($1)
ON CONFLICT DO NOTHING
-- If conflict: event already processed, return success
-- If no conflict: proceed with processing
```

---

## Decision: Blockchain Reorg Handling

**Choice**: Block confirmation threshold with rollback mechanism

**Rationale**:
- Webhooks should only be processed after block finality threshold (e.g., 12 blocks for Ethereum)
- Track `processed_block_number` per vault
- On reorg detection: mark affected events as "unconfirmed" and re-fetch from chain
- Store both `commitment` and `block_number` for verification

**Reorg detection strategy**:
1. Track latest processed block number per vault
2. When new webhook arrives with lower block number → potential reorg
3. Use chain reorganization webhook (if available) or polling mechanism
4. Rollback tree state to common ancestor block

---

## Decision: Database Schema

**Choice**: Supabase PostgreSQL (managed database)

**Tables** (SQL migrations in `supabase/migrations/`):
```sql
-- Vault configuration
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INTEGER NOT NULL,
    vault_address VARCHAR(42) NOT NULL,
    current_root VARCHAR(66),
    latest_block_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_id, vault_address)
);

-- Merkle tree nodes (sparse storage)
CREATE TABLE merkle_nodes (
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 20),
    index BIGINT NOT NULL,
    hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (vault_id, level, index)
);

-- Processed events for idempotency
CREATE TABLE processed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('NewCommitment', 'NullifierSpent')),
    event_id VARCHAR(100) NOT NULL,
    block_number BIGINT NOT NULL,
    commitment_hash VARCHAR(66),
    nullifier_hash VARCHAR(66),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'reverted')),
    UNIQUE(vault_id, event_id)
);

-- Indexes for performance
CREATE INDEX idx_merkle_nodes_vault_level ON merkle_nodes(vault_id, level);
CREATE INDEX idx_processed_events_vault_block ON processed_events(vault_id, block_number);
CREATE INDEX idx_vaults_chain_address ON vaults(chain_id, vault_address);
```

**Supabase Features Used**:
- Row Level Security (RLS) for data isolation
- Connection pooling via Supabase (no manual pool management)
- Database webhooks for real-time updates (optional)

---

## Decision: API Design

**Choice**: Supabase Edge Functions (Deno runtime, serverless)

**Endpoints** (each is a separate Edge Function):
```
POST /webhook          # EVM listener webhook receiver (Edge Function: webhook)
GET  /merkle/:vaultId/root     # Get current Merkle root (Edge Function: merkle-root)
GET  /merkle/:vaultId/path/:leafIndex  # Get Merkle path (witness) (Edge Function: merkle-path)
GET  /health           # Health check (Edge Function: health)
```

**Supabase Edge Function Benefits**:
- Serverless, scales automatically
- Global edge distribution for low latency
- Direct database access via Supabase client
- No cold starts (V8 isolate pooling)

**Performance optimizations**:
- Supabase connection pooling (managed)
- LRU cache for frequently accessed Merkle paths
- Async processing for webhook ingestion
- Database prepared statements via Supabase client

---

## Decision: Multi-Vault Isolation

**Choice**: Database-level isolation using composite keys

**Implementation**:
- Every operation scoped by `(chain_id, vault_address)`
- Idempotency key includes vault context
- Merkle tree nodes reference vault_id foreign key
- API endpoints require vault identification

**Benefits**:
- Clean data separation per vault
- Easy vault archival/deletion
- Parallel processing of different vaults
- No cross-vault contamination
