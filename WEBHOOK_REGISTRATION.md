# GhostRoute Webhook Registration

This document contains the POST requests needed to register all PrivacyVault events with your external webhook listener.

## Configuration

- **Contract Address**: `0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4`
- **Chain**: Sepolia (Chain ID: 11155111)
- **Webhook URL**: `https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook`
- **Blockchain Network ID**: `YOUR_SEPOLIA_NETWORK_UUID` ⚠️ **REPLACE THIS WITH YOUR LISTENER'S SEPOLIA UUID**

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
    "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
    "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
    "eventSignature": "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"Deposit\",\"inputs\":[{\"name\":\"commitment\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"leafIndex\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":false,\"internalType\":\"bytes32\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload** (for direct use):
```json
{
  "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
  "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
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
    "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
    "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
    "eventSignature": "ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"ActionExecuted\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"actionHash\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"investAmount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload**:
```json
{
  "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
  "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
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
    "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
    "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
    "eventSignature": "MerkleRootUpdated(bytes32,bytes32,uint256)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"MerkleRootUpdated\",\"inputs\":[{\"name\":\"oldRoot\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":true,\"internalType\":\"bytes32\"},{\"name\":\"leafCount\",\"type\":\"uint256\",\"indexed\":false,\"internalType\":\"uint256\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload**:
```json
{
  "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
  "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
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
    "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
    "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
    "eventSignature": "VerifierUpdated(address)",
    "abiJson": "[{\"type\":\"event\",\"name\":\"VerifierUpdated\",\"inputs\":[{\"name\":\"newVerifier\",\"type\":\"address\",\"indexed\":true,\"internalType\":\"address\"}],\"anonymous\":false}]",
    "preferredChannel": 1,
    "webhookUrl": "https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"
  }'
```

**JSON Payload**:
```json
{
  "contractAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
  "blockchainNetworkId": "YOUR_SEPOLIA_NETWORK_UUID",
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

1. **blockchainNetworkId**: Replace `YOUR_SEPOLIA_NETWORK_UUID` with the actual UUID for Sepolia in your listener system
2. **YOUR_LISTENER_URL**: Replace with your listener's registration endpoint URL

### 📋 Steps to Register

1. Get your Sepolia network UUID from your listener service
2. Replace all instances of `YOUR_SEPOLIA_NETWORK_UUID` in the payloads above
3. Replace `YOUR_LISTENER_URL` with your actual listener registration endpoint
4. Execute the cURL commands or send the POST requests using your preferred method
5. Verify each registration was successful

---

## Testing the Webhook

After registration, you can test if events are being received by:

1. Making a test deposit to the PrivacyVault contract:
   ```bash
   cast send 0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4 \
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
  "eventId": "deposit_0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4_12345",
  "chainId": 11155111,
  "vaultAddress": "0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4",
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
2. **Verify contract address**: Ensure `0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4` is correct
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
