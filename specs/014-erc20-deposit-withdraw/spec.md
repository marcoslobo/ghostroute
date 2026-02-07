# Feature Specification: Uniswap Pool Investment via Privacy Vault

**Feature Branch**: `014-uniswap-pool-investment`  
**Created**: 2026-02-07  
**Status**: Draft  
**Input**: User request: "Precisamos agora fazer que com que o user consiga investir em pools da uniswap(ja temos elas listada na tela). Deve usar os notes que o user ja fez deposito(usar o webhook da v4)"

## Summary

Enable users to invest their deposited notes (ETH/ERC20) into Uniswap v4 liquidity pools while maintaining full privacy. The system will use the existing `executeAction` function in PrivacyVault, which validates ZK proofs and atomically adds liquidity to pools via the PrivacyLiquidityHook. The investment flow must select from existing notes (populated via webhook v4 deposits), calculate UTXO splits, and execute privacy-preserving liquidity additions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Pool and Invest Note (Priority: P0)

User wants to select a Uniswap v4 pool from the pools list and invest funds from one of their deposited notes. The UI should show available pools with their APY/TVL info, allow note selection, investment amount input, and execute the privacy-preserving liquidity addition.

**Why this priority**: This is the core feature requested by the user - connecting the existing pool list UI with the ability to invest using deposited notes.

**Independent Test**: Can be tested by having a user with deposited notes, selecting a pool, entering investment amount, confirming transaction, and verifying the liquidity was added to the pool while a change note was created.

**Acceptance Scenarios**:

1. **Given** user has a note with 1 ETH and pools are listed, **When** user selects ETH/USDC pool and invests 0.5 ETH, **Then** liquidity is added to the pool, change note (0.5 ETH minus gas) is created, and input note is marked as spent.
2. **Given** user has no unspent notes, **When** user views pool list, **Then** "Invest" buttons are disabled with message "Deposit first to invest".
3. **Given** user tries to invest more than note value, **When** user enters amount > note.value, **Then** error is shown "Insufficient funds in selected note".
4. **Given** pool requires both tokens (ETH + USDC), **When** user only has ETH note, **Then** system should handle single-sided liquidity or show warning.

---

### User Story 2 - Investment Preview with UTXO Split (Priority: P0)

User wants to see a preview of the investment transaction including: investment amount going to pool, gas estimate, and change note value before confirming.

**Why this priority**: The UTXO model requires users to understand the split between investment and change.

**Independent Test**: Enter investment amount and verify preview shows correct breakdown.

**Acceptance Scenarios**:

1. **Given** user enters 0.5 ETH investment from 1 ETH note, **When** preview is displayed, **Then** shows: Investment: 0.5 ETH, Gas: ~0.01 ETH, Change: 0.49 ETH.
2. **Given** investment + gas > note value, **When** preview calculates, **Then** shows error "Insufficient funds for investment and gas".

---

### User Story 3 - Generate ZK Proof and Execute Action (Priority: P0)

System must generate a ZK proof that proves ownership of the input note and commits to the Uniswap action parameters (actionHash), then call `executeAction` on PrivacyVault.

**Why this priority**: ZK proof is fundamental to the privacy guarantee.

**Acceptance Scenarios**:

1. **Given** user confirms investment, **When** proof is generated, **Then** proof includes: root, nullifierHash, changeCommitment, actionHash, investAmount.
2. **Given** proof is valid, **When** executeAction is called, **Then** transaction succeeds, nullifier is spent, change commitment is added to tree.
3. **Given** proof generation fails, **When** error occurs, **Then** user-friendly error is shown and no transaction is submitted.

---

### User Story 4 - Process Investment via Webhook (Priority: P1)

The webhook must process `ActionExecuted` events to update the Merkle tree with the change commitment, allowing the user to later spend or withdraw from the change note.

**Why this priority**: Without webhook processing, change notes from investments cannot be used.

**Acceptance Scenarios**:

1. **Given** executeAction emits ActionExecuted event, **When** webhook receives event, **Then** change commitment is added to Merkle tree in database.
2. **Given** multiple investments in same block, **When** webhook processes events, **Then** all change commitments are added in correct order (by leafIndex).

---

### User Story 5 - Pool Selection with Token Matching (Priority: P1)

User should only be able to invest in pools that match their note's token type. ETH notes can invest in pools containing WETH/ETH; ERC20 notes can invest in pools containing that token.

**Acceptance Scenarios**:

1. **Given** user has ETH note, **When** viewing pools, **Then** pools containing ETH/WETH are highlighted as compatible.
2. **Given** user has USDC note, **When** viewing pools, **Then** pools containing USDC are highlighted as compatible.

---

## Edge Cases

- What happens if the Uniswap pool doesn't have enough liquidity to accept the position?
- What happens if the pool tick range is invalid for the current price?
- How to handle slippage in liquidity addition?
- What happens if the transaction reverts after nullifier is marked spent (should be atomic, but verify)?
- How to handle fee-on-transfer tokens in pool investment?
- What if the user's note was created before the current Merkle root (historical root validation)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to select a pool from the existing pool list and initiate investment
- **FR-002**: System MUST allow users to select an unspent note as the funding source
- **FR-003**: System MUST calculate and display investment preview with UTXO split (investment, gas, change)
- **FR-004**: System MUST generate a ZK proof binding the note, actionHash (pool + params), and change commitment
- **FR-005**: System MUST call `executeAction` on PrivacyVault with valid proof and parameters
- **FR-006**: System MUST update the Merkle tree via webhook when ActionExecuted event is emitted
- **FR-007**: System MUST save the change note to localStorage for future use
- **FR-008**: System MUST mark the input note as spent after successful investment
- **FR-009**: System MUST compute actionHash using `keccak256(abi.encodePacked(poolId, tickLower, tickUpper, amount0, amount1))`
- **FR-010**: System MUST validate that the note's token matches one of the pool's tokens

### Non-Functional Requirements

- **NFR-001**: Proof generation SHOULD complete within 30 seconds on modern browsers
- **NFR-002**: Investment transaction SHOULD cost less than 300,000 gas
- **NFR-003**: UI MUST show loading states during proof generation and transaction confirmation

### Key Entities

- **InvestmentParams**: poolId, tickLower, tickUpper, liquidityDelta, noteCommitment
- **ActionHash**: keccak256 hash of pool parameters for ZK proof binding
- **ChangeNote**: UTXO note created from investment change (inputNote.value - investAmount - gas)
- **PoolPosition**: Resulting LP position from investment

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully invest notes into any listed pool
- **SC-002**: Change notes from investments can be spent in subsequent transactions
- **SC-003**: No on-chain link exists between the original deposit and the pool investment
- **SC-004**: Webhook correctly processes ActionExecuted events and updates Merkle tree
- **SC-005**: All investment transactions are atomic (if pool add fails, nullifier is not spent)

## Technical Architecture

### Existing Components to Integrate

1. **PrivacyVault.executeAction()** - Already implemented (lines 280-365)
   - Validates ZK proof
   - Prevents double-spending via nullifier
   - Adds change commitment to Merkle tree
   - Emits ActionExecuted event

2. **PrivacyLiquidityHook** - Already implemented
   - Receives calls from PrivacyVault
   - Validates authorization via transient storage
   - Adds liquidity to Uniswap v4 pool

3. **Frontend Pool List** - Already implemented (UniswapV4PoolsClient.tsx)
   - Displays available pools
   - Has "Add Liquidity" button (needs to be connected to notes)

4. **Webhook (v4)** - Partially implemented
   - Processes Deposit events
   - TODO: Add ActionExecuted event handling

### New/Modified Components

1. **PoolInvestmentForm** - New component
   - Pool selector (from existing list)
   - Note selector (from unspent notes)
   - Investment amount input
   - Preview display
   - Confirm button

2. **usePoolInvestment** - New hook
   - Combines useUTXOMath with pool-specific logic
   - Computes actionHash for selected pool
   - Generates ZK proof
   - Calls executeAction

3. **Webhook Handler** - Extend existing
   - Add handleActionExecuted function
   - Process ActionExecuted events
   - Add change commitment to Merkle tree

4. **actionHash Computation** - Frontend utility
   - Match contract's computeActionHash logic
   - Encode pool parameters correctly
