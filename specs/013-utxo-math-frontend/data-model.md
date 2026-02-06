# Data Model: UTXO Math for React Frontend

## Core Entities

### Note
Represents a UTXO-style note in the privacy system.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| commitment | string | Yes | 0x-prefixed hex, 66 chars | Poseidon hash commitment |
| nullifier | string | No | 0x-prefixed hex, 66 chars | Nullifier for spent notes |
| value | bigint | Yes | > 0 | Amount in wei |
| token | string | Yes | EIP-55 checksum or '0x000...0' | Token address |
| salt | Uint8Array | No | 32 bytes | Randomness for commitment |
| createdAt | Date | Auto | ISO 8601 | Timestamp |

### UTXO Math Result
Output of UTXO calculation for transaction preview.

| Field | Type | Description |
|-------|------|-------------|
| inputNotes | Note[] | Notes being spent |
| outputNotes | Note[] | Notes being created (investment + change) |
| changeNote | Note | Computed change note |
| changeCommitment | string | Commitment for change note |
| gasEstimate | bigint | Estimated gas in wei |
| investmentAmount | bigint | Amount being invested |
| totalInput | bigint | Sum of input note values |
| totalOutput | bigint | Sum of output note values |

### Execute Action Payload
Data sent to executeAction function.

| Field | Type | Description |
|-------|------|-------------|
| action | string | Action type (e.g., 'uniswap-v4-swap') |
| inputNotes | Note[] | Notes being spent |
| outputNotes | Note[] | Notes being created |
| changeCommitment | string | Hex commitment of change note |

## Validation Rules

1. **Balance Conservation**: `totalInput = investmentAmount + gasEstimate + totalOutput`
2. **Sufficient Funds**: `inputNote.value >= investmentAmount + gasEstimate`
3. **Commitment Format**: Must be valid 0x-prefixed hex string
4. **Note Value**: Must be positive bigint

## State Transitions

```
[Available Note]
    │
    ├─ [User selects for investment]
    │
    ▼
[Selected Note]
    │
    ├─ [Transaction confirmed]
    │
    ▼
[Spent Note] ──► [New Notes Created]
                     │
                     ├─ Investment Note
                     └─ Change Note
```

## TypeScript Interfaces

```typescript
interface Note {
  commitment: string;
  nullifier?: string;
  value: bigint;
  token: string;
  salt?: Uint8Array;
  createdAt?: Date;
}

interface UTXOMathResult {
  inputNotes: Note[];
  outputNotes: Note[];
  changeNote: Note;
  changeCommitment: string;
  gasEstimate: bigint;
  investmentAmount: bigint;
  totalInput: bigint;
  totalOutput: bigint;
}

interface ExecuteActionPayload {
  action: string;
  inputNotes: Note[];
  outputNotes: Note[];
  changeCommitment: string;
}

interface GasEstimate {
  base: bigint;
  withBuffer: bigint;
  unit: 'wei' | 'gwei' | 'ether';
}

interface InvestmentParams {
  inputNote: Note;
  investmentAmount: bigint;
  gasPrice?: bigint;
}
```
