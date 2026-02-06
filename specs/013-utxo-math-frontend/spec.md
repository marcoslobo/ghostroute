# Feature Specification: UTXO Math Logic for React Frontend

## Overview

Implement UTXO (Unspent Transaction Output) math logic in the GhostRoute React frontend to handle privacy-preserving DeFi interactions. When a user with a note of 10 ETH wants to invest 2 ETH in Uniswap, the frontend must automatically calculate the change amount (considering gas/fees), generate a new secret for the change note, and pass its commitment as `changeCommitment` to the `executeAction` function.

## Background

GhostRoute uses a UTXO-like model for privacy-preserving Ethereum transactions:
- **Notes**: Encrypted UTXO-like objects representing user funds
- **Commitments**: Cryptographic commitments (Poseidon hash) of note secrets
- **Merkle Tree**: Sparse Merkle Tree storing note commitments for verification
- **Actions**: DeFi operations (e.g., Uniswap swaps) that spend notes and create new ones

## Requirements

### Functional Requirements

1. **UTXO Balance Calculation**
   - FR1: Frontend must track all user's notes from local state/storage
   - FR2: Calculate total spendable balance from all notes
   - FR3: Display individual note balances and total balance

2. **Transaction Math**
   - FR4: Given input note value (10 ETH) and investment amount (2 ETH), calculate change = input - investment - gas/fees
   - FR5: For 10 ETH note investing 2 ETH, change should be ~7.99 ETH (accounting for gas)
   - FR6: Validate sufficient funds before transaction execution

3. **Change Note Generation**
   - FR7: Generate new cryptographic secret for change note
   - FR8: Compute commitment hash for the new change note
   - FR9: Include change commitment in executeAction payload

4. **Gas/Fee Estimation**
   - FR10: Estimate gas costs for Uniswap swap action
   - FR11: Subtract estimated gas from change amount
   - FR12: Display gas estimate to user before confirmation

### Non-Functional Requirements

- NFR1: Client-side computation only (no private keys leave device)
- NFR2: Responsive UI feedback during calculation
- NFR3: Offline-capable for balance calculations

## Technical Requirements

### Integration Points

- **executeAction function**: Receives `{ action, inputNotes, outputNotes, changeCommitment }`
- **Poseidon hashing**: For commitment generation (poseidon-lite library)
- **Local storage**: Persist notes and state (no server-side state for notes)
- **Noir circuits**: Verify transactions on-chain (already implemented)

### User Flow

1. User selects a note (e.g., 10 ETH) to invest
2. User enters investment amount (e.g., 2 ETH)
3. Frontend calculates:
   - Investment amount: 2 ETH
   - Estimated gas: 0.01 ETH
   - Change amount: 10 - 2 - 0.01 = 7.99 ETH
4. Frontend generates new secret for 7.99 ETH change note
5. Frontend computes commitment for change note
6. User confirms transaction
7. Frontend calls `executeAction({ action: 'uniswap-v4-swap', inputNotes: [10 ETH note], outputNotes: [2 ETH invest note, 7.99 ETH change note], changeCommitment: <computed-commitment> })`

## Acceptance Criteria

- [ ] UTXO math correctly calculates change amount (input - investment - gas)
- [ ] New secrets are generated client-side using cryptographic randomness
- [ ] Commitments are computed using Poseidon hash function
- [ ] executeAction receives correct changeCommitment parameter
- [ ] UI displays breakdown: investment, gas, change
- [ ] Transaction fails gracefully if insufficient funds

## Out of Scope

- Backend API changes (already exists)
- Smart contract modifications
- Noir circuit changes
- Wallet connection integration (separate feature)
