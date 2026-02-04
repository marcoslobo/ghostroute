# Research: Webhook Payload Processor (Logic)

## Decision: TypeScript/Deno Runtime for Webhook Processing

**Chosen**: TypeScript 20.x with Deno Runtime for Edge Functions

**Rationale**:
- Existing infrastructure already uses Deno for Supabase Edge Functions
- Native TypeScript support without transpilation overhead
- Excellent performance characteristics for serverless edge deployment
- Compatible with existing poseidon-lite and uuid dependencies

**Alternatives Considered**:
- Node.js 20 LTS: More mature ecosystem but requires transpilation and build steps
- Rust Wasm: Better performance but higher implementation complexity

---

## Decision: PostgreSQL for Idempotency Storage

**Chosen**: PostgreSQL 15+ with connection pooling

**Rationale**:
- Existing Supabase infrastructure provides managed PostgreSQL
- Connection pooling via Supabase eliminates cold start issues
- ACID compliance ensures reliable idempotency checks
- Compatible with existing pg client usage in codebase

**Alternatives Considered**:
- Redis: Faster but adds infrastructure complexity
- In-memory: Not suitable for distributed edge functions

---

## Decision: Dynamic Parameter Mapping via Zip Operation

**Chosen**: Array-based mapping using zip operation on DecodedParametersNames and DecodedParametersValues

**Rationale**:
- Simple, type-safe transformation
- Easy to debug and test
- No external dependencies beyond standard library

**Implementation Pattern**:
```typescript
const mapParams = (names: string[], values: unknown[]): Record<string, unknown> => 
  Object.fromEntries(names.map((name, i) => [name, values[i]]));
```

---

## Decision: Composite Primary Key for Idempotency

**Chosen**: Composite key (TransactionHash, LogIndex) for idempotency

**Rationale**:
- Unique identification of each emitted event
- Handles blockchain reorgs where same transaction appears at different log index
- Database UNIQUE constraint prevents duplicate processing

**Database Schema**:
```sql
CREATE TABLE processed_events (
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    vault_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (transaction_hash, log_index)
);
```

---

## Decision: Event Type Routing Pattern

**Chosen**: Switch-based event type routing with type guards

**Rationale**:
- Clear separation of concerns for each event type
- Easy to extend for new event types
- Type-safe handling with TypeScript

**Event Types Supported**:
- Deposit: commitment + leafIndex → Merkle leaf insertion
- ActionExecuted: nullifierHash + changeCommitment + changeIndex → UTXO update

---

## Decision: Multi-Vault Isolation via vaultAddress + chainId Context

**Chosen**: Store ContractAddress as vaultAddress and BlockchainNetworkId as chainId

**Rationale**:
- Supports multiple vaults on same or different chains
- Enables chain-specific Merkle tree updates
- Maintains data isolation for privacy guarantees
