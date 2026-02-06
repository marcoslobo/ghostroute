#!/bin/bash

VERIFIER_ADDRESS="0x2F669A07A17E664D2168b9CD5e8EF6AB5dcFe70d"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"

# Prepare public inputs (same as in withdraw)
ROOT="0x4131e0af671c3c15d03879ead37b949e3c3ad43b04ac6decffbd55f0997e488f"
NULLIFIER_HASH="0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6"
CHANGE_COMMITMENT="0x1c0fa973e2c743b567cb3b01c5b1e9844711de6ed36bc749f18f3feca2b24403"
RECIPIENT="0x34EdEB37D1D133705B829bC21Db3F30c743083b5"
AMOUNT="100000000000000"

# Calculate actionHash (same as contract does)
ACTION_HASH=$(cast keccak $(cast abi-encode "f(address,uint256)" $RECIPIENT $AMOUNT))

echo "Testing verifier with proof: 0x00"
echo ""
echo "Public Inputs:"
echo "  [0] root:             $ROOT"
echo "  [1] nullifierHash:    $NULLIFIER_HASH"
echo "  [2] changeCommitment: $CHANGE_COMMITMENT"
echo "  [3] actionHash:       $ACTION_HASH"
echo "  [4] amount:           $(printf "0x%064x" $AMOUNT)"
echo ""

# Test verifier.verify() with placeholder proof
PROOF="0x00"

# Call verifier directly
echo "Calling verifier.verify()..."
RESULT=$(cast call $VERIFIER_ADDRESS "verify(bytes,bytes32[])(bool)" \
    $PROOF \
    "[$ROOT,$NULLIFIER_HASH,$CHANGE_COMMITMENT,$ACTION_HASH,$(printf "0x%064x" $AMOUNT)]" \
    --rpc-url $RPC_URL 2>&1)

echo "Result: $RESULT"

if [ "$RESULT" == "true" ]; then
    echo "✅ Verifier accepts the proof"
else
    echo "❌ Verifier REJECTS the proof (this is the problem!)"
    echo ""
    echo "This means MockZKVerifier is not behaving as expected."
    echo "It should accept any proof by default."
fi
