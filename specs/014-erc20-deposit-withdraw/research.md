# Research: ERC20 Deposit & Withdraw Support

**Feature**: `014-erc20-deposit-withdraw`  
**Date**: 2026-02-06

---

## Decision 1: SafeERC20 Pattern for Token Transfers

**Decision**: Use OpenZeppelin's `SafeERC20` library (v5.x) with `safeTransfer` and `safeTransferFrom` for all ERC20 interactions.

**Rationale**:
- SafeERC20's `_callOptionalReturn` handles three token types: standard (returns `true`), non-compliant like USDT (returns nothing), and failing (returns `false`).
- The project already has OpenZeppelin v5.0.2 available via the remapping: `@openzeppelin/contracts/=lib/v4-periphery/lib/v4-core/lib/openzeppelin-contracts/contracts/`
- `try/catch` is inferior because it cannot detect `return false` or handle missing return values.

**Import paths**:
```solidity
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
```

**Alternatives considered**:
- Raw `IERC20.transfer()` / `IERC20.transferFrom()`: Rejected — fails on USDT and other non-standard tokens.
- `try/catch` wrapping: Rejected — cannot handle missing return values, adds code complexity.
- Custom safe transfer library: Rejected — no advantage over battle-tested OpenZeppelin implementation.

---

## Decision 2: Fee-on-Transfer and Rebasing Token Strategy

**Decision**: Block fee-on-transfer and rebasing tokens. Implement a token allowlist (`mapping(address => bool) public allowedTokens`) controlled by the contract owner.

**Rationale**:
- Fee-on-transfer tokens break the commitment scheme: `H(nullifier, token, amount, salt)` would contain `amount = 100` but the vault only receives 98 tokens. This breaks ZK proof soundness.
- Rebasing tokens (stETH) change the vault balance without deposits/withdrawals, creating extractable surplus or deficit.
- All major privacy protocols (Tornado Cash, Railgun) use allowlists for this reason.
- The privacy vault's UTXO model requires exact amount matching between commitment and actual balance.

**Alternatives considered**:
- Balance-before/after check pattern: Rejected for privacy context — user must know exact received amount before generating commitment off-chain, creating timing attack vectors with variable fees.
- Support all tokens without restriction: Rejected — introduces critical accounting bugs.

---

## Decision 3: Permit2 Integration Approach

**Decision**: Use Permit2's `SignatureTransfer` (specifically `permitWitnessTransferFrom`) for the production deposit path. Maintain a simplified `deposit()` with standard `transferFrom` for testing.

**Rationale**:
- **SignatureTransfer** leaves zero on-chain state (no `allowance[]` mapping leakage), preserving privacy. AllowanceTransfer stores `allowance[owner][token][spender]` which reveals user-to-vault relationships.
- `permitWitnessTransferFrom` binds the deposit commitment to the Permit2 signature, preventing front-running attacks where someone substitutes a different commitment.
- Each transfer uses a unique, single-use nonce — no dangling approvals if vault is compromised.
- Gas: ~92,900 for SignatureTransfer vs ~132,900 for first-time AllowanceTransfer.

**Alternatives considered**:
- AllowanceTransfer (`permit` + `transferFrom`): Rejected — leaks on-chain state via allowance mapping, creates dangling approval risk, no witness binding.
- Direct `transferFrom` only (no Permit2): Rejected for production path — requires users to send a separate approval transaction, worse UX.
- Both AllowanceTransfer and SignatureTransfer: Rejected — unnecessary complexity.

**Implementation notes**:
- The existing `Permit2Lib.sol` has incomplete `SignatureTransfer` types (defined as opaque `type ... is bytes32` aliases). Must be replaced with proper `ISignatureTransfer` interface.
- User prerequisite: one-time `token.approve(PERMIT2, type(uint256).max)` — most DeFi users already have this from Uniswap usage.
- The `depositWithPermit` function signature changes to accept `PermitTransferFrom` instead of `PermitSingle`.

---

## Decision 4: ERC20 Withdrawal actionHash Design

**Decision**: Include the token address in the actionHash for withdrawals: the circuit computes `actionHash = pedersen(recipient, asset_id, amount)`. The contract receives `actionHash` as a ZK-verified public input and does NOT recompute Pedersen on-chain.

**Rationale**:
- Without binding `token` into the actionHash, a malicious party could redirect a withdrawal proof meant for USDC to drain WETH instead.
- The circuit already has `asset_id` in the Note struct and constrains `note.asset_id == change_note.asset_id`. Adding it to the actionHash closes the binding loop.
- Pedersen hashing is cheap in ZK circuits but expensive on-chain. The ZK proof guarantees that `actionHash == pedersen(recipient, token, amount)`, so the contract can trust the verified public input.

**Contract pattern**:
```solidity
function withdrawERC20(
    bytes calldata proof,
    bytes32 root,
    bytes32 nullifierHash,
    bytes32 changeCommitment,
    bytes32 actionHash,    // Pedersen hash verified by circuit
    address token,
    address payable recipient,
    uint256 amount
) external nonReentrant { ... }
```

**Alternatives considered**:
- Contract recomputes keccak256 actionHash: Rejected for the production path — creates hash mismatch with circuit's Pedersen hash. However, the simplified `withdraw()` for ETH currently uses `keccak256(abi.encodePacked(recipient, amount))`, which is acceptable for the testing path with a mock verifier.
- Token address as separate public input: Possible but redundant — binding it into actionHash is cleaner and the circuit already enforces it.

---

## Decision 5: Balance Tracking Strategy

**Decision**: Use internal accounting (`mapping(address => uint256) public tokenBalances`) alongside the allowlist. For ETH, continue using `address(this).balance`.

**Rationale**:
- Internal accounting is immune to external manipulation (airdrops, rebasing).
- `IERC20.balanceOf(address(this))` requires an external call (~2,600 gas for cold SLOAD) and is vulnerable to direct token transfers inflating the balance.
- Railgun and Aztec use internal balance tracking.
- The allowlist already prevents fee-on-transfer tokens, so the internal accounting will always be accurate for allowed tokens.

**Deposit**: `tokenBalances[token] += amount;`
**Withdraw**: `require(tokenBalances[token] >= amount); tokenBalances[token] -= amount;`

**Alternatives considered**:
- `IERC20.balanceOf(address(this))` only: Rejected — vulnerable to direct transfers and rebasing.
- No balance tracking (rely on transfer failure): Rejected — poor error messages, no view function for balance queries.

---

## Decision 6: Reentrancy Protection for ERC20 Transfers

**Decision**: Defense-in-depth with three layers: (1) CEI (Checks-Effects-Interactions) ordering, (2) `nonReentrant` modifier, (3) token allowlist.

**Rationale**:
- CEI ensures all state mutations (nullifier marking, Merkle tree update) happen before external `safeTransfer` call. A reentrant call would fail at "Nullifier already spent".
- `nonReentrant` (existing custom implementation) provides additional protection.
- Token allowlist ensures only audited tokens interact with the vault, preventing malicious token contracts with reentrant `transfer()` hooks.

**Alternatives considered**:
- EIP-1153 transient storage lock: Already used in PrivacyLiquidityHook, but the existing `ReentrancyGuard` is sufficient for the vault.
- CEI only (no reentrancy guard): Rejected — defense-in-depth is required by constitution's security-first principle.

---

## Decision 7: Backward Compatibility Approach

**Decision**: Keep existing `deposit()` (ETH-only, simplified) and `withdraw()` (ETH-only) functions unchanged. Add new functions: `depositERC20()` (simplified, transferFrom), `withdrawERC20()`, and update `depositWithPermit()` (production, Permit2).

**Rationale**:
- All existing tests must continue to pass without modification.
- The simplified ETH functions serve as the testing/development path.
- New ERC20 functions follow the same patterns but handle token transfers.
- `depositWithPermit()` already exists but needs its ERC20 transfer stub completed.

**Alternatives considered**:
- Unified `deposit(token, amount, ...)` replacing the existing one: Rejected — breaks backward compatibility with existing tests and scripts.
- Token parameter added to existing `withdraw()`: Rejected — changes function signature, breaks existing callers.

---

## Decision 8: Commitment Hash Structure for ERC20

**Decision**: ERC20 commitment hash is `H(nullifier, token, amount, salt)` — the token address is a mandatory component of the commitment for ERC20 notes. For ETH, the existing `H(nullifier, amount, salt)` is preserved for backward compatibility, with `token = address(0)` implied.

**Rationale**:
- Binding the token address into the commitment prevents a note created for USDC from being spent as WETH.
- The circuit's `Note.asset_id` field already supports this — it just needs to be populated with the token address.
- For ETH notes, `asset_id = address(0)` maintains backward compatibility.

**Alternatives considered**:
- Separate Merkle trees per token: Rejected — reduces anonymity set, contradicts constitution ("unified Merkle Tree structure").
- Token not in commitment (verified separately): Rejected — weaker binding, creates asset substitution attack vector.
