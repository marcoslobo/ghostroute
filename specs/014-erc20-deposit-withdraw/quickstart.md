# Quickstart: ERC20 Deposit & Withdraw Support

**Feature**: `014-erc20-deposit-withdraw`  
**Date**: 2026-02-06

---

## Prerequisites

- Foundry installed (`forge`, `cast`, `anvil`)
- Node.js 20+ (for scripts)
- Repository cloned with submodules: `git clone --recursive`

## Setup

```bash
# Navigate to contracts directory
cd ghostroute-contracts

# Install dependencies (includes OpenZeppelin, Permit2)
forge install

# Compile contracts
forge build
```

## Running Tests

### All tests (including existing ETH tests + new ERC20 tests)

```bash
cd ghostroute-contracts
forge test -vvv
```

### ERC20-specific tests only

```bash
cd ghostroute-contracts
forge test --match-path "tests/ERC20*" -vvv
```

### Gas report for ERC20 operations

```bash
cd ghostroute-contracts
forge test --match-path "tests/ERC20*" --gas-report
```

## Local Deployment (Anvil)

### Terminal 1: Start Anvil

```bash
cd ghostroute-contracts
anvil
```

### Terminal 2: Deploy

```bash
cd ghostroute-contracts

# Deploy MockZKVerifier
VERIFIER=$(forge create mocks/MockZKVerifier.sol:MockZKVerifier \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')

# Deploy PrivacyVault with verifier and Permit2 address
# Note: On local Anvil, use a mock Permit2 or deploy one
VAULT=$(forge create PrivacyVault.sol:PrivacyVault \
  --constructor-args $VERIFIER 0x000000000022D473030F116dDEE9F6B43aC78BA3 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')

echo "Vault deployed at: $VAULT"

# Deploy a mock ERC20 for testing
TOKEN=$(forge create tests/mocks/MockERC20.sol:MockERC20 \
  --constructor-args "Mock USDC" "mUSDC" 6 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --json | jq -r '.deployedTo')

echo "Mock token deployed at: $TOKEN"

# Add token to allowlist
cast send $VAULT "addAllowedToken(address)" $TOKEN \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Usage Examples

### ERC20 Deposit (Simplified Path)

```bash
# 1. Mint tokens to user
cast send $TOKEN "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 1000000000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 2. Approve vault to spend tokens
cast send $TOKEN "approve(address,uint256)" $VAULT 1000000000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 3. Deposit ERC20 tokens
# commitment and nullifier are example values — in production, generate off-chain
cast send $VAULT \
  "depositERC20(address,uint256,bytes32,bytes32)" \
  $TOKEN \
  500000000 \
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
  0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 4. Check vault token balance
cast call $VAULT "getTokenBalance(address)" $TOKEN \
  --rpc-url http://127.0.0.1:8545
```

### Verify Backward Compatibility

```bash
# ETH deposit still works exactly as before
# NOTE: Use small ETH values (0.0001 ETH) on Sepolia to conserve testnet funds
cast send $VAULT \
  "deposit(bytes32,bytes32)" \
  0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef \
  0xcafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe \
  --value 0.0001ether \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Key Differences from ETH Flow

| Aspect | ETH | ERC20 |
|--------|-----|-------|
| Deposit function | `deposit(commitment, nullifier) payable` | `depositERC20(token, amount, commitment, nullifier)` |
| Withdraw function | `withdraw(proof, root, nullifier, change, recipient, amount)` | `withdrawERC20(proof, root, nullifier, change, actionHash, token, recipient, amount)` |
| Fund transfer (deposit) | `msg.value` | `IERC20.safeTransferFrom()` |
| Fund transfer (withdraw) | `recipient.call{value: amount}` | `IERC20.safeTransfer()` |
| Balance check | `address(this).balance` | `tokenBalances[token]` |
| Commitment hash | `H(nullifier, amount, salt)` | `H(nullifier, token, amount, salt)` |
| actionHash | `keccak256(recipient, amount)` | `pedersen(recipient, token, amount)` |
| Prerequisite | None | Token must be in allowlist |
