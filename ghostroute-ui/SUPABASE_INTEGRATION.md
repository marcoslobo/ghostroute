# GhostRoute UI - Supabase API Integration

## ✅ Completed

1. **API Client Created**: [src/services/ghostrouteApi.ts](src/services/ghostrouteApi.ts)
   - `getMerklePath()` - Fetch Merkle path for a leaf index
   - `getMerkleRoot()` - Get current Merkle root
   - `checkHealth()` - Health check endpoint

2. **Merkle Proof Service Updated**: [src/services/merkleProof.ts](src/services/merkleProof.ts)
   - Now uses GhostRoute ZK API instead of HyperIndex
   - Fallback to placeholder proofs when API unavailable

3. **Note Type Enhanced**: [src/types/utxo/note.ts](src/types/utxo/note.ts)
   - Added `leafIndex?: number` field to track position in Merkle tree

4. **Withdraw Hook Updated**: [src/hooks/utxo/useWithdraw.ts](src/hooks/utxo/useWithdraw.ts)
   - Uses `leafIndex` from note to fetch Merkle proof
   - Graceful fallback for notes without `leafIndex`

---

## 🔧 Configuration Required

### Step 1: Get Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings → API**
4. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGc...`)

### Step 2: Update `.env` File

Edit [`.env`](.env) and replace the placeholders:

```bash
# GhostRoute ZK API (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Example:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.abc123def456
```

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test Integration

```bash
# Test health check
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/health

# Should return:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "checks": {
#     "database": true,
#     "merkleTree": true
#   },
#   "uptime": 123
# }
```

---

## ⚠️ Known Limitations

### 1. leafIndex Not Captured from Deposits

**Issue**: When users deposit ETH, the contract returns a `leafIndex`, but the current frontend doesn't capture and store it.

**Impact**:
- Withdraw will use placeholder proofs (works with placeholder verifier)
- Real ZK proofs cannot be generated without `leafIndex`

**Solution Required**:
Update [`src/hooks/utxo/useDeposit.ts`](src/hooks/utxo/useDeposit.ts) to:

1. Listen for transaction receipt after deposit
2. Extract `leafIndex` from return value or events
3. Add `leafIndex` to saved note:

```typescript
// After deposit transaction confirms
const receipt = await waitForTransactionReceipt({ hash });

// Option A: Parse return value (if available)
const leafIndex = parseDepositReturnValue(receipt);

// Option B: Listen to Insert event
const insertEvent = receipt.logs.find(log =>
  log.topics[0] === INSERT_EVENT_TOPIC
);
const leafIndex = decodeEventLog({
  abi: PRIVACY_VAULT_ABI,
  data: insertEvent.data,
  topics: insertEvent.topics,
}).args.leafIndex;

// Save note with leafIndex
const note: Note = {
  commitment,
  nullifier: bufferToHex(nullifier),
  value: amount,
  token,
  salt,
  leafIndex, // ← ADD THIS
  createdAt: new Date(),
  spent: false,
};
```

### 2. Backward Compatibility

**Issue**: Existing notes in localStorage don't have `leafIndex`.

**Current Behavior**:
- Withdraw attempts with old notes will fall back to placeholder proofs
- UI should warn users about this

**Potential Solutions**:
1. Migration script to query blockchain for historical deposits and add `leafIndex`
2. Clear localStorage and require users to re-deposit (loses privacy)
3. Continue using placeholder verifier until all notes are new

---

## 📊 API Endpoints

All endpoints require the `Authorization: Bearer <ANON_KEY>` header except `/health`.

### 1. Health Check
```bash
GET /functions/v1/health
```

No authentication needed.

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "database": true,
    "merkleTree": true
  },
  "uptime": 3600
}
```

### 2. Get Merkle Root
```bash
GET /functions/v1/merkle-root?chainId=11155111&vaultAddress=0x3e078e8af9aBaf8156Beca429A1d35B9398a2208
```

**Response**:
```json
{
  "vaultId": "uuid-here",
  "chainId": 11155111,
  "root": "0x1234...",
  "blockNumber": 5000000,
  "updatedAt": "2026-02-05T12:00:00Z"
}
```

### 3. Get Merkle Path
```bash
GET /functions/v1/merkle-path?chainId=11155111&vaultAddress=0x3e078e8af9aBaf8156Beca429A1d35B9398a2208&leafIndex=0
```

**Response**:
```json
{
  "vaultId": "uuid-here",
  "chainId": 11155111,
  "leafIndex": 0,
  "root": "0x1234...",
  "path": [
    {
      "level": 1,
      "hash": "0xabcd...",
      "side": "right"
    },
    {
      "level": 2,
      "hash": "0xef01...",
      "side": "left"
    }
    // ... 20 levels total
  ],
  "proofGeneratedAt": "2026-02-05T12:00:00Z"
}
```

---

## 🧪 Testing

### Test API Connection

```typescript
import { checkHealth, isApiConfigured } from '@/services/ghostrouteApi';

// Check if configured
console.log('API configured:', isApiConfigured());

// Test health
const health = await checkHealth();
console.log('API health:', health);
```

### Test Merkle Root Query

```typescript
import { getMerkleRoot } from '@/services/ghostrouteApi';

const root = await getMerkleRoot(
  11155111, // Sepolia
  '0x3e078e8af9aBaf8156Beca429A1d35B9398a2208'
);

console.log('Current root:', root.root);
console.log('Block number:', root.blockNumber);
```

### Test Merkle Path Query

```typescript
import { getMerklePath } from '@/services/ghostrouteApi';

const path = await getMerklePath(
  11155111,
  '0x3e078e8af9aBaf8156Beca429A1d35B9398a2208',
  0 // leafIndex
);

console.log('Root:', path.root);
console.log('Path length:', path.path.length);
console.log('Proof siblings:', path.path.map(p => p.hash));
```

---

## 🔐 Security Notes

1. **Anon Key is Public**: The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed in client-side code. This is expected.
   - It has Row Level Security (RLS) policies applied
   - Can only access public endpoints
   - Cannot modify data

2. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
   - Only used in Supabase Edge Functions
   - Has full database access

3. **Webhook Security**: Currently disabled for development
   - TODO: Re-enable signature verification when event listener supports it
   - See `ghostroute-zk-api/supabase/functions/webhook/index.ts:21-22`

---

## 📝 Next Steps

1. ✅ Configure `.env` with Supabase credentials
2. ✅ Test API connection
3. ⬜ Implement `leafIndex` capture in deposit flow
4. ⬜ Test full deposit → withdraw cycle with API
5. ⬜ Deploy frontend to production
6. ⬜ Enable webhook signature verification

---

## 🐛 Troubleshooting

### Error: "Supabase configuration missing"

**Solution**: Check that `.env` has both variables set:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart dev server after changing `.env`.

### Error: "Failed to get Merkle path: Vault not found"

**Cause**: No deposits have been made to the vault yet, so it doesn't exist in the database.

**Solution**: Make a deposit transaction first. The webhook will create the vault entry automatically.

### Error: "Failed to get Merkle root: NOT_FOUND"

**Cause**: Same as above - vault not initialized.

**Solution**: Make a deposit to initialize the vault in the database.

### API Returns Empty Path

**Cause**: The leafIndex doesn't exist in the Merkle tree yet.

**Check**:
1. Was the deposit transaction confirmed?
2. Did the webhook process the `NewCommitment` event?
3. Check Supabase logs: `supabase functions logs webhook --tail`

---

## 📚 Related Documentation

- [GhostRoute ZK API README](../ghostroute-zk-api/README.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Privacy Vault Contract](../ghostroute-contracts/src/PrivacyVault.sol)
