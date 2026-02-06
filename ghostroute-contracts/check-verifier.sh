#!/bin/bash

VERIFIER_ADDRESS="0x2F669A07A17E664D2168b9CD5e8EF6AB5dcFe70d"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"

echo "Checking verifier contract..."
echo ""

# Check if it has setInvalidProof (only MockZKVerifier has this)
echo "Trying to call Mock-specific function setInvalidProof..."
MOCK_RESULT=$(cast call $VERIFIER_ADDRESS "setInvalidProof(bytes32)" 0x0000000000000000000000000000000000000000000000000000000000000000 --rpc-url $RPC_URL 2>&1)

if echo "$MOCK_RESULT" | grep -q "Error"; then
    echo "NOT a MockZKVerifier - this is a REAL verifier!"
    echo ""
    echo "ERROR: The deployed verifier is a real ZK verifier, not a mock!"
    echo "This means it will REJECT the placeholder proof 0x00"
else
    echo "Confirmed: This IS a MockZKVerifier (has setInvalidProof function)"
fi

echo ""
echo "Checking bytecode size..."
CODE_SIZE=$(cast code $VERIFIER_ADDRESS --rpc-url $RPC_URL | wc -c)
echo "Code size: $CODE_SIZE bytes"

if [ $CODE_SIZE -lt 1000 ]; then
    echo "Size suggests Mock verifier (small bytecode)"
else
    echo "⚠️  WARNING: Large bytecode - might be real verifier!"
fi

