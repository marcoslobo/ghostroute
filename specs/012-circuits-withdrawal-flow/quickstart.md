# Quickstart: Circuit Withdrawal Flow

## Prerequisites

- Noir 1.0.0-beta.18+
- Nargo CLI installed
- Node.js 20+ (for client-side proof generation)

## Build Circuit

```bash
cd circuits
nargo compile
```

## Run Tests

```bash
cd circuits
nargo test
```

## Generate Verifier Contract

```bash
# Requires barretenberg (bb) tool
bb write_vk -b ./target/ghostroute_privacy_circuit.json -o ./target --oracle_hash keccak
bb write_solidity_verifier -k ./target/vk -o ./target/Verifier.sol
```

## Withdrawal Flow Example

### 1. Create Withdrawal Proof (Client)

```typescript
import { Note, computeCommitment, computeNullifier, pedersenHash } from './zk-utils';

const inputNote: Note = {
  asset_id: 1n,
  amount: 1000n,
  nullifier_secret: 12345n,
  blinding: 67890n,
};

const changeNote: Note = {
  asset_id: 1n,
  amount: 300n,  // Change = 1000 - 700 withdrawal
  nullifier_secret: 54321n,
  blinding: 98765n,
};

const recipient = 0x1234567890123456789012345678901234567890n;
const withdrawAmount = 700n;

// Compute actionHash = H(recipient, amount)
const actionHash = pedersenHash([recipient, withdrawAmount]);

const publicInputs = {
  root: merkleRoot,
  nullifier_hash: computeNullifier(inputNote.nullifier_secret),
  change_commitment: computeCommitment(changeNote),
  is_withdrawal: true,
  action_hash: actionHash,
  amount: withdrawAmount,
  recipient: recipient,
};

// Generate proof with private inputs (note, path, index)
const proof = await generateProof(publicInputs, {
  note: inputNote,
  index: 42n,
  path: merklePath,
  change_note: changeNote,
});
```

### 2. Submit to PrivacyVault

```solidity
privacyVault.withdraw(proof, publicInputs);
```

## Verification

The Verifier.sol contract will check:
1. Merkle proof validates input note inclusion
2. Nullifier matches derived nullifier
3. actionHash = pedersen_hash([recipient, withdrawAmount])
4. inputNote.amount = withdrawAmount + changeNote.amount
5. change_commitment matches computed change note commitment
