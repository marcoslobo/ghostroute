#!/bin/bash

VAULT_ADDRESS="0x3e078e8af9aBaf8156Beca429A1d35B9398a2208"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"
NULLIFIER_HASH="0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6"

echo "Checking deposit history..."
echo ""

# Get Deposit events
echo "Recent Deposit events:"
cast logs \
    --from-block 7400000 \
    --to-block latest \
    --address $VAULT_ADDRESS \
    "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)" \
    --rpc-url $RPC_URL \
    2>/dev/null | grep -E "commitment|nullifier" | head -30

echo ""
echo ""
echo "Key question: Was the nullifierHash $NULLIFIER_HASH"
echo "used as a RAW NULLIFIER in any previous deposit?"
echo ""
echo "If yes, that would cause 'Nullifier already spent' error"
echo "because deposit marks nullifiers[rawNullifier] = true"
echo "and withdraw checks nullifiers[hash(rawNullifier)]"
echo ""
echo "Let me check if this specific hash was used in deposit..."

IS_USED_IN_DEPOSIT=$(cast call $VAULT_ADDRESS "isNullifierUsed(bytes32)(bool)" $NULLIFIER_HASH --rpc-url $RPC_URL)
echo "Is this nullifierHash marked as used? $IS_USED_IN_DEPOSIT"

if [ "$IS_USED_IN_DEPOSIT" == "true" ]; then
    echo ""
    echo "🔴 PROBLEM FOUND!"
    echo "This nullifierHash was already used in a DEPOSIT transaction!"
    echo ""
    echo "This means:"
    echo "  - You deposited with nullifier = $NULLIFIER_HASH"
    echo "  - Contract marked: nullifiers[$NULLIFIER_HASH] = true"
    echo "  - Now you're trying to withdraw with nullifierHash = $NULLIFIER_HASH"
    echo "  - Contract checks: require(!nullifiers[$NULLIFIER_HASH])"
    echo "  - Result: REVERT!"
    echo ""
    echo "Solution: This is a bug in the contract design!"
    echo "Deposit and Withdraw use the same nullifiers mapping but for different purposes."
fi

