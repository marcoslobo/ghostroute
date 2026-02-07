# GhostRoute Webhook Registration

This document contains the POST requests needed to register all PrivacyVault events with your external webhook listener.

## Configuration

- **Contract Address**: `0x3e078e8af9aBaf8156Beca429A1d35B9398a2208`
- **Chain**: Sepolia (Chain ID: 11155111)
- **Webhook URL**: `https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook`
- **Blockchain Network ID**: `11577bdf-751a-44f5-aa58-c680ef643ba6`

## Events to Register

### 1. Deposit Event

**Event Signature**: `Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)`

**Description**: Emitted when a user deposits funds into the Privacy Vault. This is the most critical event to track as it creates new commitments in the Merkle tree.

**Parameters**:
- `commitment` (bytes32, indexed): The commitment hash
- `nullifier` (bytes32, indexed): The nullifier to prevent double-spending
- `token` (address, indexed): Token address (address(0) for ETH)
- `amount` (uint256): Deposited amount
- `leafIndex` (uint256): Position in Merkle tree
- `newRoot` (bytes32): New Merkle root after insertion

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"Deposit\",\"inputs\":[{\"name\":\"commitment\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"leafIndex\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload** (for direct use):
```json
{
  "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
  "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
  "eventSignature": "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)",
  "abiJson": "[{\"type\":\"event\",\"name\":\"Deposit\",\"inputs\":[{\"name\":\"commitment\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"leafIndex\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"}],\"anonymous\":false}]",
  "preferredChannel": 1,
  "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
}
```

---

### 2. ActionExecuted Event

**Event Signature**: `ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)`

**Description**: Emitted when a user executes a DeFi action (e.g., Uniswap swap/liquidity) through the Privacy Vault. This spends a note and potentially creates a change note.

**Parameters**:
- `nullifier` (bytes32, indexed): The spent nullifier
- `changeCommitment` (bytes32, indexed): New commitment for change
- `actionHash` (bytes32, indexed): Hash of the action parameters
- `investAmount` (uint256): Amount used in the action
- `timestamp` (uint256): Block timestamp
- `changeIndex` (uint256): Position of change commitment in tree

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"ActionExecuted\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"actionHash\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"investAmount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload**:
```json
{
  "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
  "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
  "eventSignature": "ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)",
  "abiJson": "[{\"type\":\"event\",\"name\":\"ActionExecuted\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"actionHash\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"investAmount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
  "preferredChannel": 1,
  "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
}
```

---

### 3. MerkleRootUpdated Event (Optional)

**Event Signature**: `MerkleRootUpdated(bytes32,bytes32,uint256)`

**Description**: Emitted when the Merkle tree root changes. This is automatically emitted after Deposit events. Tracking this event is optional but useful for monitoring tree state.

**Parameters**:
- `oldRoot` (bytes32, indexed): Previous root
- `newRoot` (bytes32, indexed): New root
- `leafCount` (uint256): Total leaves in tree

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "MerkleRootUpdated(bytes32,bytes32,uint256)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"MerkleRootUpdated\",\"inputs\":[{\"name\":\"oldRoot\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"leafCount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload**:
```json
{
  "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
  "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
  "eventSignature": "MerkleRootUpdated(bytes32,bytes32,uint256)",
  "abiJson": "[{\"type\":\"event\",\"name\":\"MerkleRootUpdated\",\"inputs\":[{\"name\":\"oldRoot\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"leafCount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
  "preferredChannel": 1,
  "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
}
```

---

### 4. VerifierUpdated Event (Optional)

**Event Signature**: `VerifierUpdated(address)`

**Description**: Emitted when the ZK verifier contract address is updated by the owner. This is an admin event and rarely triggered. Tracking is optional.

**Parameters**:
- `newVerifier` (address, indexed): New verifier contract address

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "VerifierUpdated(address)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"VerifierUpdated\",\"inputs\":[{\"name\":\"newVerifier\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload**:
```json
{
  "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
  "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
  "eventSignature": "VerifierUpdated(address)",
  "abiJson": "[{\"type\":\"event\",\"name\":\"VerifierUpdated\",\"inputs\":[{\"name\":\"newVerifier\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false}]",
  "preferredChannel": 1,
  "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
}
```

---

## Priority Recommendations

### Must Register (Critical)

1. **Deposit** - Required for tracking new commitments and Merkle tree updates
2. **ActionExecuted** - Required for tracking nullifier spends and change notes

### Optional (Nice to Have)

3. **MerkleRootUpdated** - Useful for monitoring tree state consistency
4. **VerifierUpdated** - Only needed for admin monitoring

---

## Before You Begin

### ⚠️ Replace Placeholders

1. **blockchainNetworkId**: Replace `11577bdf-751a-44f5-aa58-c680ef643ba6` with the actual UUID for Sepolia in your listener system
2. **YOUR_LISTENER_URL**: Replace with your listener's registration endpoint URL

### 📋 Steps to Register

1. Get your Sepolia network UUID from your listener service
2. Replace all instances of `11577bdf-751a-44f5-aa58-c680ef643ba6` in the payloads above
3. Replace `YOUR_LISTENER_URL` with your actual listener registration endpoint
4. Execute the cURL commands or send the POST requests using your preferred method
5. Verify each registration was successful

---

## Testing the Webhook

After registration, you can test if events are being received by:

1. Making a test deposit to the PrivacyVault contract:
   ```bash
   cast send 0x3e078e8af9aBaf8156Beca429A1d35B9398a2208 \
     "deposit(bytes32,bytes32)" \
     0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
     0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321 \
     --value 0.01ether \
     --rpc-url $SEPOLIA_RPC_URL \
     --private-key $PRIVATE_KEY
   ```

2. Check your webhook endpoint logs:
   ```bash
   # For Supabase Edge Functions
   supabase functions logs webhook --tail
   ```

3. Verify the Deposit event was received and processed correctly

---

## Webhook Payload Format

Your listener will send events to the Supabase webhook in this format:

```json
{
  "eventType": "NewCommitment",
  "eventId": "deposit_0x3e078e8af9aBaf8156Beca429A1d35B9398a2208_12345",
  "chainId": 11155111,
  "vaultAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
  "commitment": {
    "hash": "0x1234567890abcdef...",
    "index": 0,
    "value": "10000000000000000"
  },
  "block": {
    "number": 5000000,
    "hash": "0xabcd1234...",
    "timestamp": 1699999999
  },
  "transactionHash": "0xabcd1234..."
}
```

**Note**: You may need to configure your listener to transform the raw event data into this format. Consult your listener's documentation for details on payload transformation.

---

## Troubleshooting

### Webhook Not Receiving Events

1. **Check listener registration status**: Verify all events are registered successfully
2. **Verify contract address**: Ensure `0x3e078e8af9aBaf8156Beca429A1d35B9398a2208` is correct
3. **Check webhook URL**: Make sure `https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook` is accessible
4. **Review listener logs**: Check if listener is catching events but failing to forward them
5. **Test webhook manually**: Use curl to send a test payload directly to your webhook

### Events Being Received But Not Processed

1. **Check Supabase logs**: `supabase functions logs webhook --tail`
2. **Verify payload format**: Ensure listener is sending the correct format
3. **Check database**: Verify events are being inserted into `commitments` and `merkle_tree` tables

---

## Full Contract ABI

If you need the complete PrivacyVault ABI (all functions and events), here it is:

```json
[{"type":"event","name":"ActionExecuted","inputs":[{"name":"nullifier","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"changeCommitment","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"actionHash","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"investAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"timestamp","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"changeIndex","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Deposit","inputs":[{"name":"commitment","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"nullifier","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"leafIndex","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newRoot","type":"bytes32","indexed":false,"internalType":"bytes32"}],"anonymous":false},{"type":"event","name":"MerkleRootUpdated","inputs":[{"name":"oldRoot","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"newRoot","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"leafCount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"VerifierUpdated","inputs":[{"name":"newVerifier","type":"address","indexed":true,"internalType":"address"}],"anonymous":false}]
```

(For function definitions and the complete ABI, see `ghostroute-contracts/out/PrivacyVault.sol/PrivacyVault.json`)

---

## ERC20 Support

The PrivacyVault now supports ERC20 tokens in addition to ETH.

### Supported Tokens (Sepolia)

| Token | Address | Decimals |
|-------|---------|----------|
| ETH | `0x0000000000000000000000000000000000000000` | 18 |
| USDC (Sepolia) | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 6 |
| DAI (Sepolia) | `0xfF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357` | 18 |
| MockUSDC | `0x4Ab0Cd1A4b194268A0985232BC7A5145EdDC9125` | 6 |
| MockDAI | `0xA25Fd086df157C46Dd6BdA889F44c85F6d5AD420` | 18 |

### ERC20 Events

#### 5. AnonymousWithdrawal Event (ETH)

**Event Signature**: `AnonymousWithdrawal(bytes32,address,uint256,bytes32,uint256)`

**Parameters**:
- `nullifier` (bytes32, indexed): The spent nullifier hash
- `recipient` (address, indexed): Recipient address
- `amount` (uint256): Withdrawal amount
- `changeCommitment` (bytes32): Commitment for any change note
- `changeIndex` (uint256): Position of change commitment in tree

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "AnonymousWithdrawal(bytes32,address,uint256,bytes32,uint256)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"AnonymousWithdrawal\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"recipient\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

#### 6. AnonymousERC20Withdrawal Event

**Event Signature**: `AnonymousERC20Withdrawal(bytes32,address,address,uint256,bytes32,uint256)`

**Parameters**:
- `nullifier` (bytes32, indexed): The spent nullifier hash
- `token` (address, indexed): ERC20 token address
- `recipient` (address, indexed): Recipient address
- `amount` (uint256): Withdrawal amount
- `changeCommitment` (bytes32): Commitment for any change note
- `changeIndex` (uint256): Position of change commitment in tree

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "AnonymousERC20Withdrawal(bytes32,address,address,uint256,bytes32,uint256)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"AnonymousERC20Withdrawal\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true},{\"name\":\"recipient\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

#### 7. TokenAllowed Event

**Event Signature**: `TokenAllowed(address)`

**Parameters**:
- `token` (address, indexed): Token address added to allowlist

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "TokenAllowed(address)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"TokenAllowed\",\"inputs\":[{\"name\":\"token\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

#### 8. TokenRemoved Event

**Event Signature**: `TokenRemoved(address)`

**Parameters**:
- `token` (address, indexed): Token address removed from allowlist

**cURL Command**:
```bash
curl -X POST YOUR_LISTENER_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x3e078e8af9aBaf8156Beca429A1d35B9398a2208",
    "blockchainNetworkId": "11577bdf-751a-44f5-aa58-c680ef643ba6",
    "eventSignature": "TokenRemoved(address)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"TokenRemoved\",\"inputs\":[{\"name\":\"token\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

---

## Updated Priority Recommendations

### Must Register (Critical)

1. **Deposit** - Required for tracking new commitments and Merkle tree updates
2. **AnonymousWithdrawal** - Required for tracking ETH withdrawals
3. **AnonymousERC20Withdrawal** - Required for tracking ERC20 withdrawals

### Should Register (Recommended)

4. **ActionExecuted** - Required for tracking DeFi actions through the vault
5. **TokenAllowed** - Required for tracking which tokens are supported
6. **TokenRemoved** - Useful for tracking token removals

### Optional (Nice to Have)

7. **MerkleRootUpdated** - Useful for monitoring tree state consistency
8. **VerifierUpdated** - Only needed for admin monitoring

---

## Quick Registration Script

To register all critical events at once, run:

```bash
# Set your listener URL
LISTENER_URL="YOUR_LISTENER_URL"

# 1. Deposit
curl -s -X POST $LISTENER_URL/register -H "Content-Type: application/json" -d '{"contractAddress":"0x3e078e8af9aBaf8156Beca429A1d35B9398a2208","blockchainNetworkId":"11577bdf-751a-44f5-aa58-c680ef643ba6","eventSignature":"Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)","abiJson":"[{\"type\":\"event\",\"name\":\"Deposit\",\"inputs\":[{\"name\":\"commitment\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"leafIndex\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":false}],\"anonymous\":false}]","preferredChannel":1,"webhookUrl":"https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"}' && echo " -> Deposit registered"

# 2. AnonymousWithdrawal
curl -s -X POST $LISTENER_URL/register -H "Content-Type: application/json" -d '{"contractAddress":"0x3e078e8af9aBaf8156Beca429A1d35B9398a2208","blockchainNetworkId":"11577bdf-751a-44f5-aa58-c680ef643ba6","eventSignature":"AnonymousWithdrawal(bytes32,address,uint256,bytes32,uint256)","abiJson":"[{\"type\":\"event\",\"name\":\"AnonymousWithdrawal\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"recipient\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]","preferredChannel":1,"webhookUrl":"https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"}' && echo " -> AnonymousWithdrawal registered"

# 3. AnonymousERC20Withdrawal
curl -s -X POST $LISTENER_URL/register -H "Content-Type: application/json" -d '{"contractAddress":"0x3e078e8af9aBaf8156Beca429A1d35B9398a2208","blockchainNetworkId":"11577bdf-751a-44f5-aa58-c680ef643ba6","eventSignature":"AnonymousERC20Withdrawal(bytes32,address,address,uint256,bytes32,uint256)","abiJson":"[{\"type\":\"event\",\"name\":\"AnonymousERC20Withdrawal\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true},{\"name\":\"recipient\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]","preferredChannel":1,"webhookUrl":"https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"}' && echo " -> AnonymousERC20Withdrawal registered"

# 4. ActionExecuted
curl -s -X POST $LISTENER_URL/register -H "Content-Type: application/json" -d '{"contractAddress":"0x3e078e8af9aBaf8156Beca429A1d35B9398a2208","blockchainNetworkId":"11577bdf-751a-44f5-aa58-c680ef643ba6","eventSignature":"ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)","abiJson":"[{\"type\":\"event\",\"name\":\"ActionExecuted\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"actionHash\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"investAmount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]","preferredChannel":1,"webhookUrl":"https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"}' && echo " -> ActionExecuted registered"

# 5. TokenAllowed
curl -s -X POST $LISTENER_URL/register -H "Content-Type: application/json" -d '{"contractAddress":"0x3e078e8af9aBaf8156Beca429A1d35B9398a2208","blockchainNetworkId":"11577bdf-751a-44f5-aa58-c680ef643ba6","eventSignature":"TokenAllowed(address)","abiJson":"[{\"type\":\"event\",\"name\":\"TokenAllowed\",\"inputs\":[{\"name\":\"token\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]","preferredChannel":1,"webhookUrl":"https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"}' && echo " -> TokenAllowed registered"

# 6. TokenRemoved
curl -s -X POST $LISTENER_URL/register -H "Content-Type: application/json" -d '{"contractAddress":"0x3e078e8af9aBaf8156Beca429A1d35B9398a2208","blockchainNetworkId":"11577bdf-751a-44f5-aa58-c680ef643ba6","eventSignature":"TokenRemoved(address)","abiJson":"[{\"type\":\"event\",\"name\":\"TokenRemoved\",\"inputs\":[{\"name\":\"token\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]","preferredChannel":1,"webhookUrl":"https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"}' && echo " -> TokenRemoved registered"

echo ""
echo "All critical events registered!"
```

---

## Updated Full Contract ABI

```json
[
  {"type":"event","name":"ActionExecuted","inputs":[{"name":"nullifier","type":"bytes32","indexed":true},{"name":"changeCommitment","type":"bytes32","indexed":true},{"name":"actionHash","type":"bytes32","indexed":true},{"name":"investAmount","type":"uint256","indexed":false},{"name":"timestamp","type":"uint256","indexed":false},{"name":"changeIndex","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"event","name":"Deposit","inputs":[{"name":"commitment","type":"bytes32","indexed":true},{"name":"nullifier","type":"bytes32","indexed":true},{"name":"token","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"leafIndex","type":"uint256","indexed":false},{"name":"newRoot","type":"bytes32","indexed":false}],"anonymous":false},
  {"type":"event","name":"AnonymousWithdrawal","inputs":[{"name":"nullifier","type":"bytes32","indexed":true},{"name":"recipient","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"changeCommitment","type":"bytes32","indexed":false},{"name":"changeIndex","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"event","name":"AnonymousERC20Withdrawal","inputs":[{"name":"nullifier","type":"bytes32","indexed":true},{"name":"token","type":"address","indexed":true},{"name":"recipient","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"changeCommitment","type":"bytes32","indexed":false},{"name":"changeIndex","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"event","name":"MerkleRootUpdated","inputs":[{"name":"oldRoot","type":"bytes32","indexed":true},{"name":"newRoot","type":"bytes32","indexed":true},{"name":"leafCount","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"event","name":"VerifierUpdated","inputs":[{"name":"newVerifier","type":"address","indexed":true}],"anonymous":false},
  {"type":"event","name":"TokenAllowed","inputs":[{"name":"token","type":"address","indexed":true}],"anonymous":false},
  {"type":"event","name":"TokenRemoved","inputs":[{"name":"token","type":"address","indexed":true}],"anonymous":false}
]
```

---

## Before You Begin

### Replace Placeholders

1. **LISTENER_URL**: Replace `YOUR_LISTENER_URL` with your listener's registration endpoint URL in the Quick Registration Script

### Steps to Register

1. Replace `YOUR_LISTENER_URL` with your actual listener registration endpoint
2. Execute the cURL commands or use the Quick Registration Script above
3. Verify each registration was successful

### Testing ERC20 Deposits

To test ERC20 deposits, first approve the vault to spend your tokens:

```bash
# Approve USDC for deposit
cast send 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 \
  "approve(address,uint256)" \
  0x3e078e8af9aBaf8156Beca429A1d35B9398a2208 \
  1000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Then deposit
cast send 0x3e078e8af9aBaf8156Beca429A1d35B9398a2208 \
  "depositERC20(address,uint256,bytes32,bytes32)" \
  0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 \
  1000000 \
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
  0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```
