# Quickstart: Uniswap Pool Investment via Privacy Vault

**Feature**: `014-uniswap-pool-investment`  
**Date**: 2026-02-07

---

## Overview

This guide shows how to invest deposited notes into Uniswap v4 pools while maintaining privacy. The investment flow:

1. User selects a pool from the list
2. User selects an unspent note
3. User enters investment amount
4. System calculates change note
5. User confirms and transaction executes via `executeAction`
6. Webhook processes the event and updates Merkle tree

---

## Prerequisites

- Foundry installed (`forge`, `cast`, `anvil`)
- Node.js 20+ (for frontend)
- Repository cloned with submodules
- Deposited notes in PrivacyVault (from prior deposits)

---

## Frontend Usage

### 1. Connect Wallet and View Pools

Navigate to the pools page. Compatible pools will be highlighted based on your notes.

### 2. Click "Invest" on a Pool

The investment modal opens with:
- Note selector (showing unspent notes matching pool tokens)
- Investment amount input
- Tick range configuration (advanced)
- Preview panel

### 3. Review Investment Preview

```
Investment Preview
─────────────────
Input Note:     1.5 ETH
Investment:     1.0 ETH
Gas Estimate:   0.01 ETH
Change Note:    0.49 ETH
─────────────────
Action Hash:    0x1234...5678
Pool:           ETH/USDC (0.30%)
Tick Range:     [-887220, 887220]
```

### 4. Confirm Transaction

Click "Confirm Investment". The system will:
1. Generate ZK proof (placeholder for MVP)
2. Submit `executeAction` transaction
3. Wait for confirmation
4. Save change note to localStorage
5. Mark input note as spent

---

## Code Examples

### Using usePoolInvestment Hook

```typescript
import { usePoolInvestment } from '@/hooks/utxo/usePoolInvestment';
import { useNotes } from '@/hooks/utxo/useNotes';

function InvestmentComponent({ pool }) {
  const { unspentNotes } = useNotes();
  const { 
    invest, 
    calculateInvestment, 
    isCompatiblePool,
    isPending,
    error 
  } = usePoolInvestment();

  // Filter compatible notes
  const compatibleNotes = unspentNotes.filter(
    note => isCompatiblePool(pool, note)
  );

  // Calculate preview
  const handleAmountChange = (amount: string) => {
    const investAmount = parseEther(amount);
    const preview = calculateInvestment(
      selectedNote,
      pool,
      investAmount,
      -887220, // tickLower
      887220   // tickUpper
    );
    setPreview(preview);
  };

  // Execute investment
  const handleInvest = async () => {
    const result = await invest({
      inputNote: selectedNote,
      pool,
      investAmount: parseEther(amount),
      tickLower: -887220,
      tickUpper: 887220,
    });
    
    if (result.success) {
      console.log('Investment successful!');
      console.log('Change note:', result.changeNote);
    }
  };

  return (
    <div>
      {isPending && <p>Confirming...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleInvest}>Invest</button>
    </div>
  );
}
```

### Computing ActionHash

```typescript
import { computeActionHash } from '@/utils/utxo/actionHash';

// Compute actionHash for pool investment
const actionHash = computeActionHash(
  pool.fullPoolId,          // bytes32 pool ID
  -887220,                  // tickLower
  887220,                   // tickUpper
  parseEther('1.0'),        // amount0Desired
  0n                        // amount1Desired (single-sided)
);

console.log('Action Hash:', actionHash);
// 0x1234567890abcdef...
```

### Checking Pool Compatibility

```typescript
import { isPoolCompatible, getInvestmentSide } from '@/utils/utxo/poolCompatibility';

// Check if note can invest in pool
const canInvest = isPoolCompatible(pool, note);
console.log('Compatible:', canInvest); // true/false

// Get which side of the pool the note matches
const side = getInvestmentSide(pool, note);
console.log('Investment side:', side); // 0, 1, or -1
```

---

## Contract Interaction (Manual)

### Using cast to call executeAction

```bash
# Set variables
VAULT="0x3e078e8af9aBaf8156Beca429A1d35B9398a2208"
RPC_URL="https://go.getblock.io/..."
PRIVATE_KEY="0x..."

# Placeholder proof (works with MockZKVerifier)
PROOF="0x00"

# Get current Merkle root
ROOT=$(cast call $VAULT "currentRoot()" --rpc-url $RPC_URL)

# Your values (compute off-chain)
NULLIFIER_HASH="0x..."     # keccak256(note.nullifier)
CHANGE_COMMITMENT="0x..."  # H(change_nullifier, token, change_amount, salt)
ACTION_HASH="0x..."        # keccak256(poolId, tickLower, tickUpper, amount0, amount1)
INVEST_AMOUNT="1000000000000000000"  # 1 ETH in wei
UNISWAP_PARAMS="0x"        # Reserved for future use

# Execute investment
cast send $VAULT \
  "executeAction(bytes,bytes32,bytes32,bytes32,bytes32,uint256,bytes)" \
  $PROOF \
  $ROOT \
  $NULLIFIER_HASH \
  $CHANGE_COMMITMENT \
  $ACTION_HASH \
  $INVEST_AMOUNT \
  $UNISWAP_PARAMS \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --gas-limit 300000
```

### Computing ActionHash with cast

```bash
# Pool parameters
POOL_ID="0x1234..."        # bytes32 pool ID
TICK_LOWER="-887220"       # int24
TICK_UPPER="887220"        # int24
AMOUNT0="1000000000000000000"  # uint256
AMOUNT1="0"                # uint256

# Compute actionHash (matches contract's computeActionHash)
ACTION_HASH=$(cast call $VAULT \
  "computeActionHash(bytes32,int24,int24,uint256,uint256)" \
  $POOL_ID $TICK_LOWER $TICK_UPPER $AMOUNT0 $AMOUNT1 \
  --rpc-url $RPC_URL)

echo "Action Hash: $ACTION_HASH"
```

---

## Webhook Event Processing

### Verify Webhook Receives ActionExecuted

```bash
# Check logs for ActionExecuted event after investment
cast logs \
  --rpc-url $RPC_URL \
  --address $VAULT \
  --from-block <BLOCK_NUMBER>
```

### Expected Event Data

```
ActionExecuted(
  nullifierHash (indexed): 0x1234...
  changeCommitment: 0xabcd...
  actionHash: 0x5678...
  investAmount: 1000000000000000000
  timestamp: 1707321600
  changeIndex: 42
)
```

---

## Testing Locally

### Terminal 1: Start Anvil

```bash
cd ghostroute-contracts
anvil
```

### Terminal 2: Deploy and Fund

```bash
cd ghostroute-contracts

# Deploy using existing script
forge script script/DeployPrivacyVault.s.sol \
  --fork-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Note the deployed addresses from output
```

### Terminal 3: Make a Deposit First

```bash
VAULT="<DEPLOYED_VAULT_ADDRESS>"

# Deposit ETH to create a note
cast send $VAULT \
  "deposit(bytes32,bytes32)" \
  0x1111111111111111111111111111111111111111111111111111111111111111 \
  0x2222222222222222222222222222222222222222222222222222222222222222 \
  --value 2ether \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Terminal 4: Execute Investment

```bash
# Get current root
ROOT=$(cast call $VAULT "currentRoot()" --rpc-url http://127.0.0.1:8545)

# Execute action with placeholder values
cast send $VAULT \
  "executeAction(bytes,bytes32,bytes32,bytes32,bytes32,uint256,bytes)" \
  0x00 \
  $ROOT \
  0x3333333333333333333333333333333333333333333333333333333333333333 \
  0x4444444444444444444444444444444444444444444444444444444444444444 \
  0x5555555555555555555555555555555555555555555555555555555555555555 \
  1000000000000000000 \
  0x \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --gas-limit 300000

# Verify nullifier is spent
cast call $VAULT \
  "isNullifierUsed(bytes32)" \
  0x3333333333333333333333333333333333333333333333333333333333333333 \
  --rpc-url http://127.0.0.1:8545
# Returns: true
```

---

## Frontend Development

### Run Development Server

```bash
cd ghostroute-ui
npm install
npm run dev
```

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_PRIVACY_VAULT_SEPOLIA=0x3e078e8af9aBaf8156Beca429A1d35B9398a2208
NEXT_PUBLIC_API_URL=https://your-supabase-url/functions/v1
```

---

## Common Issues

### "Note not compatible with pool"

- The note's token doesn't match either token0 or token1 in the pool
- For ETH notes, ensure pool contains WETH

### "Merkle root mismatch"

- The root changed between proof generation and transaction submission
- Retry with fresh root from contract

### "Nullifier already spent"

- The input note was already used in another transaction
- Check localStorage for spent notes

### "ActionHash verification failed"

- Ensure frontend actionHash computation matches contract
- Use `computeActionHash` view function to verify

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. SELECT POOL                                                      │
│    - View pool list (ETH/USDC, ETH/DAI, etc.)                      │
│    - Click "Invest" on compatible pool                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. SELECT NOTE                                                      │
│    - Choose from unspent notes matching pool tokens                 │
│    - View note balance and token type                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. ENTER AMOUNT                                                     │
│    - Input investment amount                                        │
│    - System calculates: change = note.value - investment - gas      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. GENERATE PROOF                                                   │
│    - Compute nullifierHash = keccak256(note.nullifier)             │
│    - Compute changeCommitment = H(change_note)                      │
│    - Compute actionHash = keccak256(poolId, ticks, amounts)         │
│    - Generate ZK proof (placeholder for MVP)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. EXECUTE TRANSACTION                                              │
│    - Call vault.executeAction(proof, root, nullifier, ...)         │
│    - Wait for confirmation                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. UPDATE STATE                                                     │
│    - Mark input note as spent (localStorage)                        │
│    - Save change note (localStorage)                                │
│    - Webhook updates Merkle tree (database)                         │
└─────────────────────────────────────────────────────────────────────┘
```
