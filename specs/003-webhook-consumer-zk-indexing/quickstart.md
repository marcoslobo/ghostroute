# Quickstart: ZK Indexer Webhook Consumer

## Architecture

- **API**: Supabase Edge Functions (Deno runtime)
- **Database**: Supabase PostgreSQL (managed)
- **Location**: `ghostroute-zk-api/`

## Prerequisites

- Deno 1.40+ installed
- Supabase CLI
- Supabase account with project created

## Installation

```bash
# Clone and navigate to API directory
cd ghostroute-zk-api

# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

## Database Setup

```bash
# Run migrations
supabase db push

# Verify migrations in Supabase Dashboard > Database > Migrations
```

## Development

```bash
# Start local Supabase stack (includes database, auth, etc.)
supabase start

# Start Edge Functions locally
supabase functions serve --env-file .env.local

# Run tests
deno test --allow-all
```

## Configuration

Create `.env.local`:

```env
# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Webhook
WEBHOOK_SECRET=your-webhook-signing-secret

# Merkle Tree
TREE_HEIGHT=20

# Blockchain
CONFIRMATION_BLOCKS=12
DEFAULT_CHAIN_ID=1
```

## Deployment

```bash
# Deploy Edge Functions to Supabase
supabase functions deploy

# Deploy database migrations
supabase db push
```

## Webhook Integration

### Subscribe to Events

Configure your EVM listener to send webhooks to your deployed function:

```
POST https://YOUR_PROJECT.supabase.co/functions/v1/webhook
```

### Signature Verification

```javascript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// Include in header
headers: {
  'X-Webhook-Signature': signature
}
```

### Example Payloads

**NewCommitment:**

```json
{
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
}
```

**NullifierSpent:**

```json
{
  "eventType": "NullifierSpent",
  "eventId": "evt_0x123_789",
  "chainId": 1,
  "vaultAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1",
  "nullifier": {
    "hash": "0xdeadbeef1234...",
    "commitmentIndex": 42
  },
  "block": {
    "number": 18500100,
    "hash": "0x5678efgh...",
    "timestamp": 1700000000
  },
  "transactionHash": "0xefgh5678..."
}
```

## API Usage

### Get Merkle Root

```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/merkle-root?vaultId=UUID&chainId=1"
```

### Get Merkle Path (Witness)

```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/merkle-path?vaultId=UUID&chainId=1&leafIndex=42"
```

### Health Check

```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/health"
```

## Testing

```bash
# Run unit tests
deno test tests/unit/

# Run integration tests
deno test tests/integration/

# Run with coverage
deno test --coverage=cov/
```

## Supabase Dashboard

Access your deployed functions and database at:
- **Dashboard**: https://supabase.com/dashboard
- **Project**: https://YOUR_PROJECT.supabase.co

### Monitor Functions
1. Go to **Edge Functions** in the sidebar
2. View logs, metrics, and invocations

### Database Management
1. Go to **Database** > **Tables**
2. View and manage tables
3. Run SQL queries in **SQL Editor**

## Troubleshooting

### Database Connection Failed
- Verify Supabase project is linked: `supabase status`
- Check environment variables
- Ensure IP allowlist includes your IP

### Webhook Signature Invalid
- Verify `WEBHOOK_SECRET` matches between sender and receiver
- Check payload is sent as raw JSON

### Merkle Path Not Found
- Verify vault exists with correct `chainId` and `vaultAddress`
- Check leaf index is within tree bounds (0 to 2^20 - 1)
