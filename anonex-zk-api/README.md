# Anonex ZK API

Off-chain webhook consumer for ZK indexing with Supabase Edge Functions.

## Features

- **Webhook Handler**: Process `NewCommitment` and `NullifierSpent` events from EVM listeners
- **Merkle Engine**: Persistent sparse Merkle Tree (Height 20) with Poseidon/BN254 hashing
- **Idempotency**: Duplicate event detection via database constraints
- **Multi-Vault Isolation**: Separate trees per chain ID and vault address
- **API Layer**: High-performance endpoints for Merkle Path retrieval

## Tech Stack

- **Runtime**: Deno 1.40+
- **Platform**: Supabase Edge Functions (serverless)
- **Database**: Supabase PostgreSQL
- **Hashing**: poseidon-lite + scroll-tech/poseidon-bn254
- **Merkle Tree**: @zk-kit/smt

## Project Structure

```
anonex-zk-api/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── functions/
│   │   ├── webhook/index.ts     # Webhook ingestion
│   │   ├── merkle-root/index.ts # Get Merkle root
│   │   ├── merkle-path/index.ts # Get Merkle path (witness)
│   │   └── health/index.ts      # Health check
│   └── migrations/              # SQL migrations
├── src/
│   ├── merkle/
│   │   ├── hasher.ts            # Poseidon hashing
│   │   ├── tree.ts              # Merkle tree implementation
│   │   └── path.ts              # Path computation
│   ├── handlers/
│   │   ├── webhook.ts           # Webhook types & validation
│   │   └── events.ts            # Event processors
│   ├── idempotency/
│   │   └── dedup.ts             # Deduplication service
│   └── utils/
│       └── db.ts                # Supabase client
├── deno.json
├── import_map.json
└── .env.example
```

## Quick Start

### Prerequisites

- Deno 1.40+
- Supabase CLI
- Supabase project

### Installation

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Development

```bash
# Start local Supabase stack
supabase start

# Serve functions locally
supabase functions serve --env-file .env.local

# Run tests
deno test --allow-all
```

### Configuration

Create `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=your-webhook-secret
TREE_HEIGHT=20
CONFIRMATION_BLOCKS=12
```

---

## From Scratch Setup (Complete Guide)

### Step 1: Install Deno

**macOS/Linux:**

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Add Deno to PATH (add to ~/.zshrc or ~/.bashrc)
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

# Reload shell
source ~/.zshrc  # or source ~/.bashrc
```

**Windows (PowerShell as Administrator):**

```powershell
# Install Deno
iwr https://deno.land/install.ps1 -useb | iex

# Restart PowerShell to update PATH
```

**Verify installation:**

```bash
deno --version
# Should output: deno 1.40+ or higher
```

### Step 2: Install Supabase CLI

```bash
# Using npm (requires Node.js)
npm install -g supabase

# Verify installation
supabase --version
```

### Step 3: Clone and Setup Project

```bash
# Navigate to project root
cd anonex-zk-api

# Verify Deno can run
deno run --help
```

### Step 4: Configure Environment

```bash
# Copy environment example
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

**Your `.env.local` should contain:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEBHOOK_SECRET=your-webhook-secret
TREE_HEIGHT=20
CONFIRMATION_BLOCKS=12
```

### Step 5: Setup Supabase Project

**Option A: Create new Supabase project**

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project name and password
4. Wait for project creation (~2 minutes)

**Option B: Use existing project**

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 6: Run Database Migrations

```bash
# Push migrations to remote database
supabase db push

# Or run migrations locally
supabase db push --local
```

### Step 7: Start Local Development

```bash
# Start local Supabase (PostgreSQL + Auth + Storage)
supabase start

# This will start:
# - PostgreSQL on localhost:54322
# - Kong API Gateway on localhost:54321
# - All Supabase services

# In a new terminal, serve Edge Functions locally
supabase functions serve --env-file .env.local
```

### Step 8: Verify Installation

**Test Deno is working:**

```bash
cd anonex-zk-api
deno run -A -e "console.log('Deno is working!')"
```

**Run unit tests:**

```bash
deno test --allow-all tests/unit/
```

**Test webhook endpoint (local):**

```bash
curl -X POST http://localhost:54321/functions/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "NewCommitment",
    "eventId": "test_evt_001",
    "chainId": 1,
    "vaultAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
    "commitment": {
      "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "index": 0,
      "value": "1000000000000000000"
    },
    "block": {
      "number": 18500000,
      "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "timestamp": 1699999999
    },
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }'
```

**Expected response:**

```json
{
  "received": true,
  "eventId": "test_evt_001",
  "status": "accepted",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Step 9: Deploy to Production

```bash
# Deploy Edge Functions
supabase functions deploy

# Deploy database migrations
supabase db push

# Verify deployment
supabase functions list
```

---

## Troubleshooting

### Deno not found

```bash
# Check if Deno is installed
which deno

# If not found, add to PATH
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.zshrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Supabase CLI not working

```bash
# Reinstall Supabase CLI
npm uninstall -g supabase
npm install -g supabase

# Check version
supabase --version
```

### Database connection failed

```bash
# Check if local Supabase is running
supabase status

# Start local Supabase
supabase start

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Port already in use

```bash
# Stop any running Supabase services
supabase stop

# Kill process on port
lsof -ti:54321 | xargs kill -9

# Restart
supabase start
```

### Migration errors

```bash
# Reset local database
supabase db reset

# Check migration status
supabase migration list
```

## API Endpoints

### POST /webhook

Receive ZK events from EVM listener.

```bash
curl -X POST https://your-project.supabase.co/functions/v1/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: your-signature" \
  -d '{
    "eventType": "NewCommitment",
    "eventId": "evt_0x123_456",
    "chainId": 1,
    "vaultAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
    "commitment": {
      "hash": "0xabcdef1234567890...",
      "index": 42,
      "value": "1000000000000000000"
    },
    "block": {
      "number": 18500000,
      "hash": "0x1234abcd...",
      "timestamp": 1699999999
    },
    "transactionHash": "0xabcd1234..."
  }'
```

### GET /merkle-root

Get current Merkle root for a vault.

```bash
curl "https://your-project.supabase.co/functions/v1/merkle-root?chainId=1&vaultId=UUID"
```

### GET /merkle-path

Get Merkle path (witness) for ZK proof generation.

```bash
curl "https://your-project.supabase.co/functions/v1/merkle-path?chainId=1&vaultId=UUID&leafIndex=42"
```

### GET /health

Health check endpoint.

```bash
curl "https://your-project.supabase.co/functions/v1/health"
```

## Database Schema

### vaults

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| chain_id | INTEGER | EVM chain ID |
| vault_address | VARCHAR(42) | Vault contract address |
| current_root | VARCHAR(66) | Current Merkle root |
| latest_block_number | BIGINT | Latest processed block |

### merkle_nodes

| Field | Type | Description |
|-------|------|-------------|
| vault_id | UUID | FK → vaults |
| level | INTEGER | Tree level (0-20) |
| index | BIGINT | Position in level |
| hash | VARCHAR(66) | Node hash |

### processed_events

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| vault_id | UUID | FK → vaults |
| event_type | VARCHAR(50) | NewCommitment or NullifierSpent |
| event_id | VARCHAR(100) | External event ID |
| status | VARCHAR(20) | pending, confirmed, reverted |

## Deployment

```bash
# Deploy Edge Functions
supabase functions deploy

# Deploy database migrations
supabase db push
```

## Testing

```bash
# Run all tests
deno test --allow-all

# Run with coverage
deno test --coverage=cov/
```

## License

MIT
