# Future Improvements & Roadmap

This document outlines potential enhancements for GhostRoute beyond the current MVP implementation.

---

## 🔐 Enhanced Note Storage & Recovery

### Current Implementation (MVP)
- **Storage**: Browser localStorage
- **Backup**: Manual JSON export/import
- **Recovery**: User must manually backup and restore
- **Sync**: No cross-device synchronization

### Proposed: Encrypted Cloud Storage

Implement client-side encrypted storage with automatic cloud sync while preserving privacy.

#### Architecture

```typescript
// 1. User signs message with wallet
const signature = await wallet.signMessage("Encrypt GhostRoute notes");

// 2. Derive encryption key from signature (deterministic)
const encryptionKey = await deriveKey(signature);

// 3. Encrypt notes locally
const encrypted = await encrypt(JSON.stringify(notes), encryptionKey);

// 4. Store encrypted data in Supabase
await supabase
  .from('encrypted_notes')
  .upsert({
    address: userAddress,
    encrypted_data: encrypted,
    updated_at: new Date()
  });

// 5. Retrieve and decrypt
const { data } = await supabase
  .from('encrypted_notes')
  .select('encrypted_data')
  .eq('address', userAddress);

const decrypted = await decrypt(data.encrypted_data, encryptionKey);
```

#### Benefits
- ✅ **Privacy preserved**: Server cannot read note contents
- ✅ **Cross-device sync**: Access notes from any browser
- ✅ **Automatic backup**: No manual export needed
- ✅ **Recovery**: Only requires wallet access (signature)

#### Challenges
- ⚠️ **UX friction**: User must sign message on every app load
- ⚠️ **Key derivation**: Need stable signature scheme
- ⚠️ **Migration**: Existing localStorage notes need migration path

#### Implementation Checklist
- [ ] Database schema for encrypted notes
  ```sql
  CREATE TABLE encrypted_notes (
    address TEXT PRIMARY KEY,
    encrypted_data TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Encryption utilities (Web Crypto API)
  - [ ] Key derivation from wallet signature
  - [ ] AES-GCM encryption/decryption
- [ ] Storage service layer
  - [ ] `saveToCloud(notes)`
  - [ ] `loadFromCloud()`
  - [ ] Auto-sync on note changes
- [ ] UI improvements
  - [ ] Sync status indicator
  - [ ] "Restore from cloud" option
  - [ ] Conflict resolution UI

#### Security Considerations

**Encryption**:
- Use Web Crypto API (browser-native)
- AES-GCM 256-bit encryption
- Derive key from wallet signature (EIP-191)

**Privacy**:
- Server sees: address → encrypted blob (unreadable)
- Server does NOT see: nullifiers, salts, commitments

**Attack Vectors**:
- ❌ Server compromise → encrypted data leaked (but still encrypted)
- ❌ MITM → encrypted data intercepted (but useless without key)
- ❌ Signature reuse → same key derived (deterministic by design)

---

## 🔑 Deterministic Note Generation (BIP-44 style)

### Current Implementation
- **Nullifier**: Random 32 bytes
- **Salt**: Random 32 bytes
- **Recovery**: Impossible without backup

### Proposed: HD-Wallet Style Derivation

Generate notes deterministically from a master seed (like BIP-39/BIP-44).

```typescript
// Derive secrets from wallet + index
const nullifier = deriveNullifier(walletSignature, index: 0);
const salt = deriveSalt(walletSignature, index: 0);

// User can recreate ALL notes from wallet signature
// No need to backup individual notes
```

#### Benefits
- ✅ **Recovery**: Can regenerate all notes from wallet
- ✅ **No backup needed**: Wallet IS the backup
- ✅ **Predictable**: Same input → same output

#### Challenges
- ⚠️ **Indexing**: Need to know how many notes exist
- ⚠️ **Gap limit**: When to stop scanning for notes
- ⚠️ **Compatibility**: Breaks existing random notes

---

## 📡 Query Notes by Commitment (API Enhancement)

### Current Implementation
- API requires `leafIndex` to fetch Merkle proof
- User must store `leafIndex` locally

### Proposed: Commitment-Based Lookup

Add endpoint to find `leafIndex` by `commitment`.

```typescript
// New API endpoint
GET /functions/v1/find-leaf
  ?chainId=11155111
  &vaultAddress=0xAbf...
  &commitment=0xabc123...

// Response
{
  "leafIndex": 5,
  "commitment": "0xabc123...",
  "found": true
}
```

#### Benefits
- ✅ **Recovery**: Can find leafIndex from commitment
- ✅ **Cross-device**: Works even if localStorage cleared

#### Implementation
```sql
-- Add index for fast commitment lookup
CREATE INDEX idx_commitment ON merkle_nodes(vault_id, hash);

-- Query
SELECT index
FROM merkle_nodes
WHERE vault_id = ?
  AND level = 0
  AND hash = ?;
```

---

## 🔍 Blockchain Event Reconstruction

### Current Implementation
- Relies on webhook to populate Merkle tree
- No way to reconstruct from scratch

### Proposed: Historical Event Scanner

Rebuild Merkle tree from blockchain events.

```typescript
// Scan all Deposit events
const events = await publicClient.getLogs({
  address: vaultAddress,
  event: parseAbiItem('event Deposit(...)'),
  fromBlock: deploymentBlock,
  toBlock: 'latest'
});

// Rebuild tree locally or in database
for (const event of events) {
  await insertLeaf(event.args.commitment, event.args.leafIndex);
}
```

#### Use Cases
- 🔧 **Webhook failure recovery**
- 🔧 **New deployment initialization**
- 🔧 **Data verification**

---

## 🎨 UX Improvements

### Backup Reminders
- [ ] Show warning if no backup made after deposit
- [ ] Block deposits until first backup created
- [ ] Auto-download backup after each transaction

### Note Management
- [ ] Note labels/tags (encrypted)
- [ ] Filter by date/amount/status
- [ ] Search functionality
- [ ] Bulk operations

### Transaction History
- [ ] Visual timeline of deposits/withdrawals
- [ ] Link to block explorer
- [ ] Gas cost tracking

---

## 🧪 Testing & Security

### Proposed Additions
- [ ] E2E tests for backup/restore flow
- [ ] Encryption/decryption unit tests
- [ ] Key derivation consistency tests
- [ ] Cross-browser compatibility tests
- [ ] Performance benchmarks (encryption overhead)

### Security Audits
- [ ] Smart contract audit (if not done)
- [ ] Frontend security review
- [ ] Encryption scheme review
- [ ] Privacy analysis

---

## 🚀 Deployment & Operations

### Monitoring
- [ ] Track backup creation rate
- [ ] Monitor sync failures
- [ ] Alert on encryption errors
- [ ] Usage analytics (privacy-preserving)

### Documentation
- [ ] User guide for backup/restore
- [ ] Developer guide for encryption implementation
- [ ] Security best practices
- [ ] Disaster recovery procedures

---

## 📊 Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Encrypted cloud storage | High | Medium | **P0** |
| Find leaf by commitment | Medium | Low | **P1** |
| Backup reminders | Medium | Low | **P1** |
| HD-wallet derivation | High | High | P2 |
| Event reconstruction | Low | Medium | P2 |
| Note labels/search | Low | Low | P3 |

---

## 🔗 Related Projects & Inspiration

- **Tornado Cash**: Pioneer in blockchain privacy (RIP 🕊️)
- **Aztec Network**: Advanced ZK rollup with private smart contracts
- **zkBob**: Stable privacy protocol
- **Railgun**: Privacy for DeFi with shielded pools
- **MetaMask Snaps**: Extension API for custom encryption

---

## 📝 Implementation Notes

### Phase 1: Foundation (Current - MVP)
- ✅ Basic localStorage storage
- ✅ Manual JSON backup/import
- ✅ leafIndex capture from events

### Phase 2: Enhanced Recovery
- 🔲 Encrypted cloud storage
- 🔲 Find leaf by commitment API
- 🔲 Auto-backup prompts

### Phase 3: Advanced Features
- 🔲 HD-wallet derivation
- 🔲 Event reconstruction
- 🔲 Enhanced UX

### Phase 4: Production Hardening
- 🔲 Security audits
- 🔲 Performance optimization
- 🔲 Monitoring & alerts

---

## 💬 Community Feedback

*This section should be updated based on user feedback and feature requests.*

**Most Requested Features:**
1. (TBD)
2. (TBD)
3. (TBD)

**Pain Points:**
1. Manual backup process (addressed in Phase 2)
2. (TBD)
3. (TBD)

---

## 🤝 Contributing

Want to implement one of these features? Check out:
1. Development setup in [README.md](README.md)
2. Architecture docs in [ARCHITECTURE.md](ARCHITECTURE.md) (if exists)
3. Open an issue to discuss approach before starting
4. Submit PR with tests and documentation

---

*Last updated: 2026-02-05*
