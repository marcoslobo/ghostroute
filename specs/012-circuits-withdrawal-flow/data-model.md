# Data Model: Circuit Withdrawal Flow

## Entities

### WithdrawalNote (Input Note)

| Field | Type | Description |
|-------|------|-------------|
| asset_id | Field | Token address or ETH identifier |
| amount | Field | Total amount in the note |
| nullifier_secret | Field | Secret for nullifier derivation |
| blinding | Field | Random blinding factor |

**Relationships**: Same structure as existing Note, consumed by withdrawal

### ChangeNote (Change Output)

| Field | Type | Description |
|-------|------|-------------|
| asset_id | Field | Must match input note asset_id |
| amount | Field | Remaining after withdrawal |
| nullifier_secret | Field | New secret for future spending |
| blinding | Field | New random blinding factor |

**Relationships**: Created from remaining balance after withdrawal

### WithdrawalParams

| Field | Type | Description |
|-------|------|-------------|
| recipient | Field | Ethereum address receiving funds |
| withdraw_amount | Field | Amount being withdrawn |

## Validation Rules

1. `input_note.amount = withdraw_amount + change_note.amount`
2. `input_note.asset_id = change_note.asset_id`
3. `action_hash = pedersen_hash([recipient, withdraw_amount])`
4. `change_note.amount >= 0` (non-negative change)

## State Transitions

```
Note State: UNSPENT -> SPENT
    └─ Nullifier published on-chain
    └─ Change note commitment added to Merkle tree

ChangeNote State: CREATED -> UNSPENT
    └─ New commitment added to Merkle tree
```
