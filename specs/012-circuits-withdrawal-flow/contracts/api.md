# Withdrawal Flow API Contract

## Circuit Public Inputs (Verified by PrivacyVault)

### WithdrawalPublicInputs

| Field | Type | Description |
|-------|------|-------------|
| root | Field | Merkle root from PrivacyVault |
| nullifier_hash | Field | Public nullifier to invalidate spent note |
| change_commitment | Field | Commitment to the change note |
| is_withdrawal | bool | true = withdrawal, false = investment |
| action_hash | Field | H(recipient, amount) for withdrawal |
| amount | Field | withdraw_amount |
| recipient | Field | Ethereum address as Field |

### InvestmentPublicInputs (Existing)

| Field | Type | Description |
|-------|------|-------------|
| root | Field | Merkle root from PrivacyVault |
| nullifier_hash | Field | Public nullifier to invalidate spent note |
| change_commitment | Field | Commitment to the change note |
| is_withdrawal | bool | false = investment |
| action_hash | Field | H(pool_id, params) for Uniswap |
| amount | Field | invest_amount |

## PrivacyVault Interface

```solidity
interface IPrivacyVault {
  function withdraw(
    bytes calldata proof,
    WithdrawalPublicInputs calldata publicInputs
  ) external;

  function invest(
    bytes calldata proof,
    InvestmentPublicInputs calldata publicInputs
  ) external;
}
```

## Client-Side Proof Generation

```typescript
// Compute actionHash for withdrawal
const actionHash = pedersenHash([
  recipientAddressAsField,
  withdrawAmount,
]);

const publicInputs = {
  root: merkleRoot,
  nullifier_hash: computeNullifier(note.nullifierSecret),
  change_commitment: computeCommitment(changeNote),
  is_withdrawal: true,
  action_hash: actionHash,
  amount: withdrawAmount,
  recipient: recipientAddressAsField,
};
```
