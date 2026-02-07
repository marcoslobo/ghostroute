# Feature Specification: ERC20 Deposit & Withdraw Support

**Feature Branch**: `014-erc20-deposit-withdraw`  
**Created**: 2026-02-06  
**Status**: Draft  
**Input**: User description: "Preciso que alem de deposito e withdraw de ETH, possa ser feito de tokens ERC20 tambem."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ERC20 Token Deposit (Priority: P1)

User wants to deposit ERC20 tokens (e.g., USDC, DAI, WETH) into the PrivacyVault with the same privacy guarantees as ETH deposits. The vault must receive the tokens via Permit2 (gasless approval) and produce a valid Merkle tree commitment that includes the token address, ensuring the anonymity set encompasses multiple asset types within a unified tree.

**Why this priority**: The constitution mandates support for "diverse assets (ETH/ERC20) within a unified Merkle Tree." Currently, only ETH deposits work end-to-end. ERC20 deposits are the most fundamental missing piece — without them, no ERC20 withdrawals or actions are possible.

**Independent Test**: Can be fully tested by deploying a mock ERC20, approving Permit2, calling `depositERC20()`, and verifying the commitment is added to the Merkle tree, the token balance transfers to the vault, and the deposit event contains the correct token address and amount.

**Acceptance Scenarios**:

1. **Given** user has 1000 USDC and has approved Permit2, **When** user calls `depositERC20` with a valid commitment and Permit2 signature, **Then** 1000 USDC is transferred to the vault, a new leaf is added to the Merkle tree, and a `Deposit` event is emitted with `token=USDC_ADDRESS`.
2. **Given** user has 0 USDC, **When** user calls `depositERC20`, **Then** the transaction reverts with an appropriate error (Permit2 transfer failure).
3. **Given** Merkle tree at capacity (2^20 leaves), **When** user calls `depositERC20`, **Then** transaction reverts with `TreeAtCapacity` error.
4. **Given** user provides `amount=0`, **When** user calls `depositERC20`, **Then** transaction reverts with `InvalidTokenAmount` error.
5. **Given** user provides `token=address(0)`, **When** user calls `depositERC20`, **Then** transaction reverts with `InvalidToken` error (must use ETH deposit function for native ETH).

---

### User Story 2 - ERC20 Token Withdrawal (Priority: P1)

User wants to withdraw ERC20 tokens from the PrivacyVault using a ZK proof, with no on-chain link between the original deposit and the withdrawal. The withdrawal must specify the token address and amount, and the vault must transfer the correct ERC20 tokens to the recipient.

**Why this priority**: Withdrawal is the second half of the core deposit/withdraw cycle. Without ERC20 withdrawals, deposited ERC20 tokens are locked with no way to retrieve them.

**Independent Test**: Can be tested by depositing an ERC20 token, generating a ZK proof (using mock verifier), calling `withdrawERC20()`, and verifying the recipient receives the correct token amount, the nullifier is marked spent, and the change commitment is added to the tree.

**Acceptance Scenarios**:

1. **Given** vault holds 1000 USDC and user has a valid ZK proof for 500 USDC withdrawal, **When** user calls `withdrawERC20` with valid proof, root, nullifier, change commitment, recipient, token, and amount, **Then** 500 USDC is transferred to recipient, nullifier is marked spent, change commitment is added to tree.
2. **Given** vault holds 100 USDC but user attempts to withdraw 500 USDC, **When** user calls `withdrawERC20`, **Then** transaction reverts with `InsufficientBalance` error.
3. **Given** nullifier has already been spent, **When** user calls `withdrawERC20` with same nullifier, **Then** transaction reverts with `Nullifier already spent` error.
4. **Given** provided Merkle root doesn't match current root, **When** user calls `withdrawERC20`, **Then** transaction reverts with `Invalid Merkle root` error.

---

### User Story 3 - Unified Simplified Deposit (Priority: P2)

User wants a simplified deposit function (for testing/development) that supports both ETH and ERC20 in a single interface, using a `token` parameter to distinguish. For ETH, `token=address(0)` and value is sent via `msg.value`. For ERC20, `token=<token_address>` and tokens are transferred via `transferFrom` (standard approval, not Permit2).

**Why this priority**: A simplified deposit function accelerates development and testing. Permit2 integration adds complexity; having a basic `transferFrom` path allows testing the full deposit-withdraw cycle for ERC20 without Permit2 infrastructure.

**Independent Test**: Can be tested by deploying a mock ERC20, approving the vault directly, calling `deposit()` with token parameter, and verifying the commitment and token transfer.

**Acceptance Scenarios**:

1. **Given** user has approved vault for 100 DAI, **When** user calls `deposit(token=DAI, amount=100, commitment, nullifier)`, **Then** 100 DAI transfers to vault, leaf is added to tree.
2. **Given** user sends ETH with `token=address(0)`, **When** `msg.value > 0` and matches amount, **Then** ETH is deposited as before.
3. **Given** user sends ETH but `token != address(0)`, **When** `msg.value > 0`, **Then** transaction reverts (cannot send ETH for ERC20 deposit).

---

### User Story 4 - ERC20 Balance Tracking (Priority: P2)

The vault must track ERC20 token balances per token address to ensure sufficient funds exist for withdrawals. This is critical since unlike ETH (which uses `address(this).balance`), ERC20 balances must be tracked or queried via `balanceOf`.

**Why this priority**: Balance tracking is necessary for withdrawal validation but can initially rely on `IERC20.balanceOf(address(this))` rather than internal accounting.

**Independent Test**: Can be tested by depositing tokens, verifying `balanceOf` matches, withdrawing, and verifying the balance decreases accordingly.

**Acceptance Scenarios**:

1. **Given** vault has 0 USDC, **When** user deposits 500 USDC, **Then** `IERC20(USDC).balanceOf(vault)` returns 500.
2. **Given** vault has 500 USDC, **When** user withdraws 200 USDC via ZK proof, **Then** `balanceOf` returns 300.

---

### Edge Cases

- What happens when a user deposits a **fee-on-transfer token** (e.g., USDT)? The commitment amount may not match actual received amount.
- What happens when a user deposits a **rebasing token** (e.g., stETH)? The vault balance changes without deposits/withdrawals.
- How does the system handle **token address = address(0)** in ERC20-specific functions?
- What happens if the ERC20 `transfer` returns `false` instead of reverting?
- How are **WETH wrapping/unwrapping** scenarios handled? Should the vault auto-wrap ETH deposits?
- What happens if the ERC20 token is **paused** or **blacklists** the vault address?
- Privacy impact: does the `token` field in the commitment leak information about what asset is being moved?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support ERC20 token deposits via both simplified (`transferFrom`) and production (`Permit2`) paths
- **FR-002**: System MUST support ERC20 token withdrawals with ZK proof verification, identical privacy guarantees to ETH withdrawals
- **FR-003**: System MUST include the token address in the commitment hash to bind the note to a specific asset
- **FR-004**: System MUST validate that the vault holds sufficient ERC20 balance before executing a withdrawal
- **FR-005**: System MUST use SafeERC20 (or equivalent safe transfer pattern) to handle non-standard ERC20 tokens that don't return `bool`
- **FR-006**: System MUST prevent sending ETH (`msg.value > 0`) when depositing ERC20 tokens
- **FR-007**: System MUST emit events that include the token address for all ERC20 deposits and withdrawals
- **FR-008**: System MUST preserve the unified Merkle tree — ETH and ERC20 commitments coexist in the same tree
- **FR-009**: System MUST reconstruct actionHash for ERC20 withdrawals as `keccak256(abi.encodePacked(recipient, token, amount))` to bind the token type
- **FR-010**: System MUST prevent deposits of `token=address(0)` via ERC20 deposit functions (use ETH deposit instead)
- **FR-011**: System MUST maintain backward compatibility with existing ETH deposit and withdraw functions

### Key Entities

- **PrivacyVault**: Extended to handle ERC20 token transfers alongside existing ETH logic
- **ERC20 Deposit Note**: A commitment that includes `H(nullifier, token, amount, salt)` — token address is bound into the note
- **ERC20 Withdrawal**: ZK-verified transfer of ERC20 tokens from vault to recipient, with UTXO change model
- **Token Registry** (optional, future): Whitelist of supported ERC20 tokens for the vault

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ERC20 deposit gas cost under 150,000 gas (simplified path) and under 200,000 gas (Permit2 path)
- **SC-002**: ERC20 withdrawal gas cost under 250,000 gas
- **SC-003**: 100% test coverage for all ERC20 deposit and withdrawal paths
- **SC-004**: All existing ETH tests continue to pass without modification (backward compatibility)
- **SC-005**: Zero linkability between ERC20 deposit transactions and withdrawal transactions
- **SC-006**: SafeERC20 transfer pattern correctly handles non-reverting tokens (USDT-style)
