#!/bin/bash

VAULT_ADDRESS="0x3e078e8af9aBaf8156Beca429A1d35B9398a2208"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"

# The nullifierHash being used in withdraw
NULLIFIER_HASH="0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6"

echo "🔍 Checking for nullifier conflict..."
echo ""
echo "Background:"
echo "  - When you DEPOSIT, the contract marks nullifiers[rawNullifier] = true"
echo "  - When you WITHDRAW, you use nullifierHash = keccak256(rawNullifier)"
echo "  - These should be DIFFERENT values, so no conflict"
echo ""

# Check if nullifierHash is used (it shouldn't be before first withdraw)
echo "1️⃣ Checking if nullifierHash is used:"
echo "   nullifierHash: $NULLIFIER_HASH"
IS_HASH_USED=$(cast call $VAULT_ADDRESS "isNullifierUsed(bytes32)(bool)" $NULLIFIER_HASH --rpc-url $RPC_URL)
echo "   Is used? $IS_HASH_USED"
echo ""

# Now let's check the deposit event to see what raw nullifier was used
echo "2️⃣ Finding your deposit transaction..."
echo "   Looking for Deposit events with commitment from your note..."

# Get recent Deposit events
DEPOSIT_EVENTS=$(cast logs --from-block 7400000 \
    --to-block latest \
    --address $VAULT_ADDRESS \
    "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)" \
    --rpc-url $RPC_URL 2>/dev/null | grep -A 10 "commitment" | head -30)

echo "$DEPOSIT_EVENTS"
echo ""

echo "💡 Expected behavior:"
echo "   ✅ nullifierHash should NOT be used yet"
echo "   ✅ But the raw nullifier from deposit WILL be marked as used"
echo ""
echo "❌ BUG in contract: deposit() marks nullifier as used (line 100)"
echo "   This prevents the same nullifier from being reused in withdraw!"
echo ""
echo "📝 This is a design issue - deposit and withdraw use different nullifier schemes"

