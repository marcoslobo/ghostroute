# Tasks: ERC20 Deposit & Withdraw Support

**Input**: Design documents from `/specs/014-erc20-deposit-withdraw/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md

**Tests**: Included — spec.md mandates 100% branch coverage (SC-003) and the constitution requires security-first testing for all Hook logic and Merkle Tree transitions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Contract root**: `ghostroute-contracts/`
- **Main contract**: `ghostroute-contracts/PrivacyVault.sol`
- **Interfaces**: `ghostroute-contracts/interfaces/`
- **Libraries**: `ghostroute-contracts/libraries/`
- **Mocks**: `ghostroute-contracts/mocks/`
- **Tests**: `ghostroute-contracts/test/` and `ghostroute-contracts/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared test infrastructure and extend existing error/event definitions needed by all user stories.

- [X] T001 [P] Create MockERC20 contract with mint/burn capabilities in ghostroute-contracts/mocks/MockERC20.sol — must implement IERC20 with configurable decimals, `mint(address,uint256)` public function, standard `name`, `symbol`, `decimals` constructor params. Use OpenZeppelin ERC20 base: `import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";`
- [X] T002 [P] Add ERC20-specific custom errors to ghostroute-contracts/libraries/BaseLib.sol — add to PrivacyVaultErrors library: `error InvalidToken();`, `error TokenNotAllowed(address token);`, `error InsufficientTokenBalance(address token, uint256 available, uint256 requested);`, `error ETHSentForERC20();`
- [X] T003 [P] Add ERC20-specific events to ghostroute-contracts/libraries/BaseLib.sol — add to PrivacyVaultEvents library: `event AnonymousERC20Withdrawal(bytes32 indexed nullifier, address indexed token, address indexed recipient, uint256 amount, bytes32 changeCommitment, uint256 changeIndex);`, `event TokenAllowed(address indexed token);`, `event TokenRemoved(address indexed token);`
- [X] T004 Add new state variables to ghostroute-contracts/PrivacyVault.sol — add `mapping(address => uint256) public tokenBalances;` for internal balance tracking, `mapping(address => bool) public allowedTokens;` for token allowlist. Add OpenZeppelin imports: `import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";` and `import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";`. Add `using SafeERC20 for IERC20;` declaration.
- [X] T005 Add admin functions to ghostroute-contracts/PrivacyVault.sol — implement `addAllowedToken(address token) external onlyOwner` that sets `allowedTokens[token] = true` and emits `TokenAllowed(token)`, and `removeAllowedToken(address token) external onlyOwner` that sets `allowedTokens[token] = false` and emits `TokenRemoved(token)`. Both must validate `token != address(0)`.
- [X] T006 Add view functions to ghostroute-contracts/PrivacyVault.sol — implement `getTokenBalance(address token) external view returns (uint256)` returning `tokenBalances[token]`, and `isTokenAllowed(address token) external view returns (bool)` returning `allowedTokens[token]`.
- [X] T007 Update interface ghostroute-contracts/interfaces/IPrivacyVault.sol — add function signatures for `depositERC20`, `withdrawERC20`, `getTokenBalance`, `isTokenAllowed`. Keep all existing function signatures unchanged for backward compatibility.
- [X] T008 Verify all existing ETH tests pass unchanged by running `forge test --match-path "test/PrivacyVault.t.sol" -vvv` and `forge test --match-path "tests/SimpleWithdraw.t.sol" -vvv` in ghostroute-contracts/ — zero modifications to existing test files. This validates backward compatibility after state variable additions.

**Checkpoint**: Shared infrastructure ready — mock ERC20 available, errors/events defined, state variables in place, existing tests still pass.

---

## Phase 2: User Story 1 — ERC20 Token Deposit (Priority: P1)

**Goal**: Users can deposit ERC20 tokens into the PrivacyVault using a simplified `depositERC20()` function with standard `transferFrom`. Tokens are transferred to the vault, a commitment is added to the unified Merkle tree, and `tokenBalances` is updated.

**Independent Test**: Deploy MockERC20, approve vault, call `depositERC20()`, verify: token transferred, commitment in tree, `tokenBalances` updated, `Deposit` event emitted with correct token address.

### Tests for User Story 1

- [X] T009 [P] [US1] Write test for successful ERC20 deposit in ghostroute-contracts/tests/ERC20Deposit.t.sol — setup: deploy MockERC20 + MockZKVerifier + PrivacyVault, add token to allowlist, mint tokens to user, approve vault. Test: call `depositERC20(token, amount, commitment, nullifier)`, assert token balance transferred to vault, `getTokenBalance(token) == amount`, `isNullifierUsed(nullifier) == true`, leafIndex returned correctly, Merkle root updated, `Deposit` event emitted with correct token/amount/leafIndex.
- [X] T010 [P] [US1] Write test for ERC20 deposit edge cases in ghostroute-contracts/tests/ERC20Deposit.t.sol — test cases: (a) `amount=0` reverts with `InvalidTokenAmount`, (b) `token=address(0)` reverts with `InvalidToken`, (c) `commitment=bytes32(0)` reverts with `InvalidCommitment`, (d) duplicate nullifier reverts with `NullifierAlreadyUsed`, (e) token not in allowlist reverts with `TokenNotAllowed`, (f) `msg.value > 0` with ERC20 reverts with `ETHSentForERC20`, (g) tree at capacity (mock nextLeafIndex at max) reverts with `TreeAtCapacity`.
- [X] T011 [P] [US1] Write test for multiple sequential ERC20 deposits in ghostroute-contracts/tests/ERC20Deposit.t.sol — deposit 3 different amounts of the same token with unique commitments/nullifiers, verify each leafIndex increments, each root changes, total `getTokenBalance` equals sum of deposits.

### Implementation for User Story 1

- [X] T012 [US1] Implement `depositERC20` function in ghostroute-contracts/PrivacyVault.sol — signature: `function depositERC20(address token, uint256 amount, bytes32 commitment, bytes32 nullifier) external nonReentrant returns (uint256 leafIndex)`. Validations (in order): `token != address(0)` → InvalidToken, `allowedTokens[token]` → TokenNotAllowed, `msg.value == 0` → ETHSentForERC20, `commitment != bytes32(0)` → InvalidCommitment, `!nullifiers[nullifier]` → NullifierAlreadyUsed, `amount > 0` → InvalidTokenAmount, `nextLeafIndex < 1048576` → TreeAtCapacity. Effects: `IERC20(token).safeTransferFrom(msg.sender, address(this), amount)`, `nullifiers[nullifier] = true`, `commitments[commitment] = true`, `tokenBalances[token] += amount`, update Merkle root = `keccak256(currentRoot, commitment)`, increment `nextLeafIndex`. Emit `Deposit` and `MerkleRootUpdated` events. Follow CEI ordering.
- [X] T013 [US1] Run US1 tests and verify all pass — execute `forge test --match-path "tests/ERC20Deposit.t.sol" -vvv` in ghostroute-contracts/. All T009-T011 tests must pass. Also re-run `forge test --match-path "test/PrivacyVault.t.sol"` to confirm ETH tests still pass.

**Checkpoint**: ERC20 deposits work end-to-end. Users can deposit allowed ERC20 tokens. All ETH functionality unchanged.

---

## Phase 3: User Story 2 — ERC20 Token Withdrawal (Priority: P1)

**Goal**: Users can withdraw ERC20 tokens using a ZK proof. The vault verifies the proof, transfers ERC20 tokens to the recipient, marks the nullifier as spent, and adds the change commitment to the Merkle tree. Follows UTXO Spend+Change model.

**Independent Test**: Deposit an ERC20 token (using US1's `depositERC20`), then call `withdrawERC20()` with mock ZK proof, verify: recipient received tokens, nullifier spent, change commitment in tree, `tokenBalances` decreased, `AnonymousERC20Withdrawal` event emitted.

**Dependencies**: Requires US1 (depositERC20) to be complete for end-to-end testing (deposit then withdraw).

### Tests for User Story 2

- [X] T014 [P] [US2] Write test for successful ERC20 withdrawal in ghostroute-contracts/tests/ERC20Withdraw.t.sol — setup: deploy MockERC20 + MockZKVerifier + PrivacyVault, add token to allowlist, deposit ERC20 tokens first via `depositERC20`. Test: call `withdrawERC20(proof, root, nullifierHash, changeCommitment, actionHash, token, recipient, amount)`, assert recipient's ERC20 balance increased by amount, vault's `getTokenBalance(token)` decreased, `isNullifierUsed(nullifierHash) == true`, Merkle root updated with changeCommitment, `AnonymousERC20Withdrawal` event emitted with correct params, `MerkleRootUpdated` event emitted.
- [X] T015 [P] [US2] Write test for ERC20 withdrawal error cases in ghostroute-contracts/tests/ERC20Withdraw.t.sol — test cases: (a) `amount=0` reverts with `InvalidAmount`, (b) `token=address(0)` reverts with `InvalidToken`, (c) insufficient vault balance reverts with `InsufficientTokenBalance(token, available, requested)`, (d) nullifier already spent reverts, (e) invalid Merkle root reverts, (f) ZK proof verification fails reverts, (g) `changeCommitment=bytes32(0)` reverts.
- [X] T016 [P] [US2] Write test for double-spend prevention on ERC20 withdrawal in ghostroute-contracts/tests/ERC20Withdraw.t.sol — deposit ERC20, withdraw once successfully, attempt second withdrawal with same nullifierHash, verify it reverts with "Nullifier already spent".

### Implementation for User Story 2

- [X] T017 [US2] Implement `withdrawERC20` function in ghostroute-contracts/PrivacyVault.sol — signature: `function withdrawERC20(bytes calldata proof, bytes32 root, bytes32 nullifierHash, bytes32 changeCommitment, bytes32 actionHash, address token, address recipient, uint256 amount) external nonReentrant`. CHECKS (in order for gas optimization — cheap checks first): `amount > 0`, `token != address(0)`, `allowedTokens[token]`, `tokenBalances[token] >= amount` → InsufficientTokenBalance, `!nullifiers[nullifierHash]`, `root == currentRoot`. Build publicInputs array (5 elements: root, nullifierHash, changeCommitment, actionHash, bytes32(amount)), call `verifier.verify(proof, publicInputs)`. Validate `changeCommitment != bytes32(0)`. EFFECTS: `nullifiers[nullifierHash] = true`, `commitments[changeCommitment] = true`, `tokenBalances[token] -= amount`, update Merkle root, increment nextLeafIndex. INTERACTIONS: `IERC20(token).safeTransfer(recipient, amount)`. Emit `AnonymousERC20Withdrawal` and `MerkleRootUpdated`.
- [X] T018 [US2] Run US2 tests and verify all pass — execute `forge test --match-path "tests/ERC20Withdraw.t.sol" -vvv` in ghostroute-contracts/. All T014-T016 tests must pass. Also re-run all previous tests to confirm no regressions.

**Checkpoint**: Full ERC20 deposit-withdraw cycle works. Users can deposit ERC20 tokens and withdraw them to any address using ZK proofs.

---

## Phase 4: User Story 3 — Unified Simplified Deposit (Priority: P2)

**Goal**: A single simplified deposit function that handles both ETH and ERC20 via a `token` parameter. For ETH: `token=address(0)` with `msg.value`. For ERC20: `token=<address>` with `transferFrom`. This replaces the need to call two different functions during testing.

**Independent Test**: Call the unified deposit with `token=address(0)` + ETH value and verify ETH path works. Call with `token=MockERC20` + amount and verify ERC20 path works. Verify cross-contamination is blocked (ETH sent with ERC20 token).

**Dependencies**: None on other user stories (can implement independently), but builds on Phase 1 infrastructure.

### Tests for User Story 3

- [X] T019 [P] [US3] Write test for unified deposit with ETH path in ghostroute-contracts/tests/ERC20Deposit.t.sol — call the existing `deposit(commitment, nullifier)` with ETH value, verify it still works exactly as before (backward compatibility). This is a regression test.
- [X] T020 [P] [US3] Write test for unified deposit with ERC20 path in ghostroute-contracts/tests/ERC20Deposit.t.sol — if a new unified function is added: test `deposit(token, amount, commitment, nullifier)` where `token != address(0)`, verify ERC20 transferred, commitment added to tree. If not adding a new unified function, test that `depositERC20` correctly handles the ERC20 path as the designated ERC20 entry point.
- [X] T021 [P] [US3] Write test for ETH/ERC20 cross-contamination prevention in ghostroute-contracts/tests/ERC20Deposit.t.sol — test: calling `depositERC20(token, amount, commitment, nullifier)` with `msg.value > 0` reverts with `ETHSentForERC20`. Test: calling `deposit(commitment, nullifier)` with `msg.value == 0` reverts with "Must send ETH".

### Implementation for User Story 3

- [X] T022 [US3] Verify the existing `deposit()` function in ghostroute-contracts/PrivacyVault.sol remains unchanged and operational — the existing `deposit(bytes32, bytes32) payable` handles ETH. The new `depositERC20(address, uint256, bytes32, bytes32)` handles ERC20. No unified function is needed since Solidity function overloading + separate entry points is cleaner. Document this decision as a code comment in PrivacyVault.sol near the deposit functions: `// ETH: use deposit() | ERC20: use depositERC20() | Production: use depositWithPermit()`.
- [X] T023 [US3] Run US3 tests and verify all pass — execute `forge test --match-contract "ERC20Deposit" -vvv` in ghostroute-contracts/. All T019-T021 tests must pass.

**Checkpoint**: Both ETH and ERC20 deposit paths are tested and documented. Clear separation between `deposit()` (ETH) and `depositERC20()` (ERC20).

---

## Phase 5: User Story 4 — ERC20 Balance Tracking (Priority: P2)

**Goal**: Verify the internal balance accounting (`tokenBalances` mapping) accurately tracks ERC20 balances through deposits and withdrawals, and the `getTokenBalance()` view function returns correct values.

**Independent Test**: Deposit multiple tokens, verify `getTokenBalance` per token. Withdraw some, verify balances decrease correctly. Verify ETH balance is NOT tracked in `tokenBalances` (uses `address(this).balance`).

**Dependencies**: Requires US1 (deposit) and US2 (withdraw) for end-to-end balance tracking.

### Tests for User Story 4

- [X] T024 [P] [US4] Write test for multi-token balance tracking in ghostroute-contracts/tests/ERC20Deposit.t.sol — deploy 2 different MockERC20 tokens (e.g., "MockUSDC" 6 decimals, "MockDAI" 18 decimals). Add both to allowlist. Deposit 1000 USDC and 500 DAI. Verify `getTokenBalance(USDC) == 1000`, `getTokenBalance(DAI) == 500`, `getTokenBalance(unknownToken) == 0`.
- [X] T025 [P] [US4] Write test for balance tracking through deposit-withdraw cycle in ghostroute-contracts/tests/ERC20Withdraw.t.sol — deposit 1000 USDC, verify balance is 1000. Withdraw 400 USDC, verify balance is 600. Deposit another 200 USDC, verify balance is 800.
- [X] T026 [P] [US4] Write test for admin allowlist functions in ghostroute-contracts/tests/ERC20Deposit.t.sol — test `addAllowedToken`: owner adds token, verify `isTokenAllowed` returns true, `TokenAllowed` event emitted. Test `removeAllowedToken`: owner removes token, verify `isTokenAllowed` returns false, `TokenRemoved` event emitted. Test: non-owner calling `addAllowedToken` reverts with "Not owner". Test: after removing token, deposits of that token revert with `TokenNotAllowed`. Test: after removing token, existing deposits can still be withdrawn (token balance still exists).

### Implementation for User Story 4

- [X] T027 [US4] Verify balance tracking is correctly integrated in deposit and withdraw functions — this is a verification task: confirm that `depositERC20` increments `tokenBalances[token] += amount` and `withdrawERC20` decrements `tokenBalances[token] -= amount` (already implemented in T012 and T017). Verify `getTokenBalance` view function works (implemented in T006). No new code needed if T004/T006/T012/T017 were implemented correctly.
- [X] T028 [US4] Run US4 tests and verify all pass — execute `forge test --match-path "tests/ERC20*" -vvv` in ghostroute-contracts/. All T024-T026 tests must pass. Run full test suite: `forge test -vvv` to confirm zero regressions.

**Checkpoint**: Internal balance accounting is verified correct. Multi-token support works. Admin allowlist functions tested.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gas optimization, full regression, deployment script updates, and documentation.

- [X] T029 [P] Run gas report for all ERC20 operations — execute `forge test --match-path "tests/ERC20*" --gas-report` in ghostroute-contracts/. Verify: `depositERC20` < 150,000 gas (SC-001), `withdrawERC20` < 250,000 gas (SC-002). If gas targets are exceeded, identify optimization opportunities (e.g., reorder storage writes, reduce redundant SLOADs).
- [X] T030 [P] Update deployment script ghostroute-contracts/script/DeployPrivacyVault.s.sol — update constructor call to include `_permit2` address parameter. Add Permit2 canonical address `0x000000000022D473030F116dDEE9F6B43aC78BA3` as a constant. After deployment, call `addAllowedToken()` for initial set of supported tokens (e.g., USDC, DAI, WETH on target network). Update `ghostroute-contracts/script/DeployFresh.s.sol` and `ghostroute-contracts/script/DeployAll.s.sol` similarly.
- [X] T031 [P] Write combined deposit-withdraw integration test in ghostroute-contracts/tests/ERC20Integration.t.sol — end-to-end test: deploy full stack, add token to allowlist, deposit ERC20, get Merkle root, construct withdrawal params with mock verifier, withdraw to different address, verify: depositor's token balance decreased, recipient's increased, vault's `tokenBalances` decreased, nullifier spent, change commitment in tree. Also test: deposit ETH, then deposit ERC20 — verify both coexist in unified Merkle tree (different leafIndexes, same root chain).
- [X] T032 Run full test suite for final validation — execute `forge test -vvv` in ghostroute-contracts/. ALL tests must pass: existing ETH tests (PrivacyVault.t.sol, SimpleWithdraw.t.sol, DebugWithdraw.t.sol, NullifierConflict.t.sol), new ERC20 tests (ERC20Deposit.t.sol, ERC20Withdraw.t.sol, ERC20Integration.t.sol), and all hook tests. Zero failures, zero regressions.
- [X] T033 Validate quickstart.md instructions — follow the steps in specs/014-erc20-deposit-withdraw/quickstart.md on a fresh Anvil instance. Verify: compilation succeeds, deployment succeeds, `addAllowedToken` works, ERC20 deposit works, `getTokenBalance` returns correct value, ETH deposit still works.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 - ERC20 Deposit (Phase 2)**: Depends on Phase 1 completion (T001-T008)
- **US2 - ERC20 Withdrawal (Phase 3)**: Depends on Phase 1 + functionally depends on US1 for deposit-then-withdraw tests
- **US3 - Unified Deposit (Phase 4)**: Depends on Phase 1 only (independent of US1/US2)
- **US4 - Balance Tracking (Phase 5)**: Depends on US1 + US2 for end-to-end balance verification
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1 — no dependencies on other stories
- **US2 (P1)**: Can start tests in parallel with US1, but implementation needs US1's `depositERC20` for deposit-then-withdraw integration
- **US3 (P2)**: Independent of US1/US2 — primarily regression/compatibility testing
- **US4 (P2)**: Depends on US1 + US2 for full balance tracking verification

### Within Each User Story

- Tests written FIRST, verified to compile (may fail until implementation)
- Implementation follows tests
- Validation run confirms all tests pass
- Existing ETH tests re-run after each phase to confirm backward compatibility

### Parallel Opportunities

**Phase 1** (all [P] tasks can run in parallel):
- T001 (MockERC20), T002 (errors), T003 (events) — different files, no dependencies
- T004 (state vars) depends on nothing but should complete before T005-T006
- T005 (admin functions), T006 (view functions) can run in parallel after T004

**Phase 2** (tests can run in parallel):
- T009, T010, T011 — all in same test file but independent test functions, can be written in parallel

**Phase 3** (tests can run in parallel):
- T014, T015, T016 — all in same test file but independent test functions

**Cross-phase parallelism**:
- US3 (Phase 4) can be developed in parallel with US2 (Phase 3) since US3 only depends on Phase 1

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all independent setup tasks together:
Task: "Create MockERC20 in ghostroute-contracts/mocks/MockERC20.sol"              # T001
Task: "Add ERC20 errors to ghostroute-contracts/libraries/BaseLib.sol"             # T002
Task: "Add ERC20 events to ghostroute-contracts/libraries/BaseLib.sol"             # T003
# Then after T002+T003 complete:
Task: "Add state variables + SafeERC20 imports to PrivacyVault.sol"                # T004
```

## Parallel Example: Phase 2 Tests

```bash
# Launch all US1 test tasks together:
Task: "Write successful deposit test in tests/ERC20Deposit.t.sol"                  # T009
Task: "Write deposit edge case tests in tests/ERC20Deposit.t.sol"                  # T010
Task: "Write multiple deposit test in tests/ERC20Deposit.t.sol"                    # T011
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: US1 — ERC20 Deposit (T009-T013)
3. Complete Phase 3: US2 — ERC20 Withdrawal (T014-T018)
4. **STOP and VALIDATE**: Full deposit-withdraw cycle works for ERC20
5. This is a fully functional MVP: users can deposit and withdraw ERC20 tokens

### Incremental Delivery

1. Phase 1 (Setup) → Infrastructure ready
2. Phase 2 (US1 - Deposit) → ERC20 deposits work → Validate independently
3. Phase 3 (US2 - Withdraw) → Full deposit-withdraw cycle → **MVP complete**
4. Phase 4 (US3 - Unified) → Developer experience improved
5. Phase 5 (US4 - Balance) → Balance tracking verified
6. Phase 6 (Polish) → Gas optimized, deployment ready

### Suggested MVP Scope

**US1 + US2** (Phases 1-3, tasks T001-T018): This delivers the core ERC20 deposit and withdrawal functionality. Users can deposit ERC20 tokens and withdraw them with ZK proofs. All privacy guarantees are maintained. Total: 18 tasks.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after its phase completes
- Existing ETH tests are re-run after EVERY phase to catch regressions immediately
- All new custom errors use the existing `PrivacyVaultErrors` library pattern
- SafeERC20 is used for ALL token transfers (no raw `transfer`/`transferFrom`)
- CEI (Checks-Effects-Interactions) ordering is mandatory for all state-changing functions
- The `depositWithPermit` Permit2 update is deferred — it's a separate concern from the core ERC20 deposit/withdraw cycle and can be added as a future enhancement once the simplified path is proven
- **Sepolia / testnet values**: Always use small ETH values (0.0001 ETH) for ETH deposits and withdrawals on Sepolia to conserve testnet funds. ERC20 token amounts are fine as-is since they use mock tokens with free minting.
