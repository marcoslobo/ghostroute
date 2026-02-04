# Quickstart: Webhook Payload Processor

## Overview

The Webhook Payload Processor handles incoming EVM listener events for the GhostRoute privacy protocol. It processes webhook payloads, maintains idempotency via TransactionHash + LogIndex, and updates the Merkle Tree for privacy vault operations.

## Prerequisites

- Deno 1.40+ (or `~/.deno/bin` in PATH)
- PostgreSQL 15+ (or Supabase local instance)
- Node.js 20+ (for testing utilities)

## Installation

```bash
# Ensure Deno is installed
deno --version

# Set up PATH if needed
export PATH="$HOME/.deno/bin:$PATH"

# Grant required permissions
deno run --allow-all --reload
```

## Configuration

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ghostroute
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Application
LOG_LEVEL=info
MERKLE_TREE_DEPTH=20

# Chains
DEFAULT_CHAIN_ID=1
SUPPORTED_CHAIN_IDS=1,11155111,84532
```

## Usage

### Running the Webhook Processor

```bash
# Start the webhook endpoint
deno run --allow-all src/services/webhook-server.ts

# Or for Supabase Edge Functions
supabase functions deploy webhook-processor
```

### Processing a Single Webhook

```bash
# Using curl
curl -X POST http://localhost:8080/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "TransactionHash": "0xabc123...",
    "LogIndex": 0,
    "ContractAddress": "0xdef456...",
    "BlockchainNetworkId": 1,
    "DecodedParametersNames": ["commitment", "leafIndex"],
    "DecodedParametersValues": ["0x...", 5]
  }'
```

### Batch Processing

```bash
curl -X POST http://localhost:8080/webhook/batch \
  -H "Content-Type: application/json" \
  -d '[
    {...event1...},
    {...event2...},
    {...event3...}
  ]'
```

## Development

### Running Tests

```bash
# Unit tests
deno test --no-check --allow-all tests/unit/

# Integration tests
deno test --no-check --allow-all tests/integration/

# Mock E2E test (without infrastructure)
deno run --allow-all scripts/mock-e2e-test.ts
```

### Full E2E Test (requires infrastructure)

```bash
# Terminal 1: Start Anvil
cd ghostroute-contracts
anvil

# Terminal 2: Start Supabase
cd ghostroute-zk-api/supabase
supabase start

# Terminal 3: Run E2E test
export PATH="$HOME/.deno/bin:$PATH"
cd ghostroute-zk-api
deno run --allow-all scripts/e2e-test.ts
```

### Local Deployment

```bash
# Deploy PrivacyVault to local network
cd ghostroute-contracts
forge script script/DeployPrivacyVault.s.sol \
  --fork-url http://127.0.0.1:8545 \
  --private-key $PRIVATE_KEY \
  --json
```

## Architecture

### Event Flow

```
EVM Listener → Webhook Endpoint → Payload Validator
                                        ↓
                               DecodedParams Mapper
                                        ↓
                              Idempotency Check
                                        ↓
                              [Cached Result] or [Process]
                                        ↓
                              Event Type Router
                                        ↓
                    ┌────────────────────┴────────────────────┐
                    ↓                                         ↓
             Deposit Event                          ActionExecuted Event
                    ↓                                         ↓
          Merkle Leaf Insert                    Nullify Old Note
                                                    ↓
                                              New UTXO Insert
                    └────────────────────┬────────────────────┘
                                        ↓
                              ProcessedEvent Record
                                        ↓
                              Return Processing Result
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Types | `src/models/webhook-processor/types.ts` | TypeScript interfaces |
| Mapper | `src/models/webhook-processor/mapper.ts` | Dynamic parameter mapping |
| Idempotency | `src/models/webhook-processor/idempotency.ts` | Duplicate detection |
| Merkle Updater | `src/models/webhook-processor/merkle-updater.ts` | Tree updates |
| Event Processor | `src/services/event-processor.ts` | Orchestration |

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "merkleTree": "ready"
  }
}
```

### Logs

Set `LOG_LEVEL` to `debug` for detailed processing logs:

```bash
LOG_LEVEL=debug deno run --allow-all src/services/webhook-server.ts
```

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
pg_isready -h localhost -p 5432

# Check Supabase status
supabase status
```

### Idempotency Conflicts

If you see duplicate processing errors:
1. Verify `TransactionHash` is exactly 66 characters (0x + 64 hex)
2. Verify `LogIndex` is a non-negative integer
3. Check if the event was already processed in a previous run

### Merkle Tree Updates Failing

Ensure:
1. `leafIndex` is within the tree depth (default 20 = ~1M leaves)
2. `commitment` is a valid 66-character hex string
3. No duplicate leaf indices exist for the same vault
