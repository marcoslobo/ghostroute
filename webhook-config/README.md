# Webhook Configuration Files

This directory contains ready-to-use configuration files for registering PrivacyVault events with your external webhook listener.

## Files

- **register-deposit.json** - Deposit event registration (CRITICAL)
- **register-action-executed.json** - ActionExecuted event registration (CRITICAL)
- **register-merkle-root-updated.json** - MerkleRootUpdated event registration (Optional)
- **register-verifier-updated.json** - VerifierUpdated event registration (Optional)
- **register-all.sh** - Bash script to register all events at once

## Quick Start

### Option 1: Using the Bash Script (Recommended)

1. Edit `register-all.sh` and update these variables:
   ```bash
   LISTENER_URL="YOUR_LISTENER_REGISTRATION_ENDPOINT"
   SEPOLIA_NETWORK_UUID="YOUR_SEPOLIA_NETWORK_UUID"
   ```

2. Run the script:
   ```bash
   ./register-all.sh
   ```

### Option 2: Manual Registration with cURL

1. Update the `blockchainNetworkId` in each JSON file:
   ```bash
   sed -i 's/YOUR_SEPOLIA_NETWORK_UUID/your-actual-uuid-here/g' *.json
   ```

2. Register each event:
   ```bash
   curl -X POST https://your-listener.com/api/register \
     -H "Content-Type: application/json" \
     -d @register-deposit.json

   curl -X POST https://your-listener.com/api/register \
     -H "Content-Type: application/json" \
     -d @register-action-executed.json
   ```

### Option 3: Using Your Listener's Dashboard

If your listener has a web UI:
1. Copy the content from each JSON file
2. Paste into the registration form
3. Replace `YOUR_SEPOLIA_NETWORK_UUID` with your actual UUID

## Event Priority

### Must Register (Critical for GhostRoute to work)

1. **Deposit** - Tracks new commitments added to the Privacy Vault
2. **ActionExecuted** - Tracks when notes are spent in DeFi actions

Without these two events, the GhostRoute API cannot maintain the Merkle tree state.

### Optional Events

3. **MerkleRootUpdated** - Nice to have for debugging tree state
4. **VerifierUpdated** - Only needed for monitoring admin changes

## Configuration Details

- **Contract Address**: `0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4`
- **Network**: Sepolia (Chain ID: 11155111)
- **Webhook URL**: `https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook`

## Verifying Registration

After registering events, test by making a deposit:

```bash
# Using cast (Foundry)
cast send 0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4 \
  "deposit(bytes32,bytes32)" \
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
  0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321 \
  --value 0.01ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

Then check your webhook logs:
```bash
supabase functions logs webhook --tail
```

You should see the Deposit event being received and processed.

## Troubleshooting

### "blockchainNetworkId not found"
- Your listener doesn't recognize the Sepolia UUID
- Contact your listener provider to get the correct UUID for Sepolia network

### "Contract address already registered"
- Events are already registered for this contract
- You may need to update or delete the existing registration first

### "Webhook URL unreachable"
- Verify your Supabase Edge Function is deployed and accessible
- Check the URL: `https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook`
- Test manually: `curl https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook`

### Events not being received
- Check listener dashboard to verify events are registered
- Ensure contract address is correct
- Verify the contract is deployed on Sepolia
- Check if listener service is running

## Next Steps

After successful registration:

1. ✅ Verify events are being received by the webhook
2. ✅ Check database tables are being populated (`commitments`, `merkle_tree`)
3. ✅ Test the frontend deposit flow
4. ✅ Test the merkle-path API endpoint

For detailed documentation, see [WEBHOOK_REGISTRATION.md](../WEBHOOK_REGISTRATION.md) in the project root.
