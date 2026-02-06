# Quickstart: UTXO Math Frontend Development

## Prerequisites

- Node.js 20 LTS
- TypeScript 5.x
- pnpm or npm

## Installation

```bash
cd frontend
npm install poseidon-lite uuid
```

## Environment Variables

```env
NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=1
```

## Development

```bash
cd frontend
npm run dev
```

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/utxoMath.ts` | UTXO calculation logic |
| `src/utils/commitment.ts` | Commitment generation |
| `src/hooks/useUTXOMath.ts` | React hook for UTXO operations |
| `src/components/InvestmentForm.tsx` | Investment input form |

## Testing

```bash
npm run test -- --testPathPattern="utxo"
```

## Example Usage

```typescript
import { computeChangeCommitment, randomSalt } from '@/utils/commitment';
import { calculateUTXO } from '@/utils/utxoMath';

const result = calculateUTXO({
  inputNote: { commitment: '0x...', value: 10n * 10n ** 18n, token: '0x000...0' },
  investmentAmount: 2n * 10n ** 18n,
  gasEstimate: 0.01n * 10n ** 18n,
});

const changeCommitment = computeChangeCommitment(
  result.changeNote.value,
  result.changeNote.token,
  result.changeNote.salt
);
```
