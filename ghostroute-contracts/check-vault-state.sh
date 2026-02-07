#!/bin/bash

# Check PrivacyVault state for debugging withdraw failures

VAULT_ADDRESS="0x3e078e8af9aBaf8156Beca429A1d35B9398a2208"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"
NULLIFIER_HASH="0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6"

echo "========================================"
echo "PrivacyVault State Check"
echo "========================================"
echo ""

# 1. Check contract balance
echo "1️⃣ Contract Balance:"
BALANCE=$(cast balance $VAULT_ADDRESS --rpc-url $RPC_URL)
BALANCE_ETH=$(echo "scale=6; $BALANCE / 1000000000000000000" | bc)
echo "   Balance: $BALANCE wei ($BALANCE_ETH ETH)"
echo ""

# 2. Check if nullifier is already used
echo "2️⃣ Nullifier Status:"
IS_USED=$(cast call $VAULT_ADDRESS "isNullifierUsed(bytes32)(bool)" $NULLIFIER_HASH --rpc-url $RPC_URL)
if [ "$IS_USED" == "true" ]; then
    echo "   ❌ Nullifier ALREADY USED (this is why withdraw is failing!)"
    echo "   This nullifier: $NULLIFIER_HASH"
    echo "   was already spent in a previous transaction."
    echo ""
    echo "   💡 Solution: Try withdrawing with a DIFFERENT note from your list"
else
    echo "   ✅ Nullifier NOT used yet (OK)"
fi
echo ""

# 3. Check current root
echo "3️⃣ Current Merkle Root:"
ROOT=$(cast call $VAULT_ADDRESS "currentRoot()(bytes32)" --rpc-url $RPC_URL)
echo "   Root: $ROOT"
echo ""

# 4. Check leaf count
echo "4️⃣ Tree State:"
LEAF_COUNT=$(cast call $VAULT_ADDRESS "getLeafCount()(uint256)" --rpc-url $RPC_URL)
echo "   Leaf count: $LEAF_COUNT"
echo ""

# 5. Summary
echo "========================================"
echo "Summary:"
echo "========================================"
echo "Withdraw amount needed: 100000000000000 wei (0.0001 ETH)"
echo "Contract balance:       $BALANCE wei ($BALANCE_ETH ETH)"
echo ""

if (( BALANCE < 100000000000000 )); then
    echo "❌ PROBLEM: Insufficient balance!"
    echo "   The contract doesn't have enough ETH to fulfill the withdrawal."
    echo "   You need to deposit more ETH first."
elif [ "$IS_USED" == "true" ]; then
    echo "❌ PROBLEM: Nullifier already used!"
    echo "   This note was already spent in a previous withdraw."
    echo "   Try selecting a different note from your list."
else
    echo "✅ Balance and nullifier look OK"
    echo "   The problem might be elsewhere. Check MetaMask error details."
fi
echo ""
