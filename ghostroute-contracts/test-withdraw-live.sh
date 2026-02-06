#!/bin/bash

# Use cast to send the actual transaction and see the real error
VAULT_ADDRESS="0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"

PROOF="0x00"
ROOT="0x4131e0af671c3c15d03879ead37b949e3c3ad43b04ac6decffbd55f0997e488f"
NULLIFIER_HASH="0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6"
CHANGE_COMMITMENT="0x1c0fa973e2c743b567cb3b01c5b1e9844711de6ed36bc749f18f3feca2b24403"
RECIPIENT="0x34EdEB37D1D133705B829bC21Db3F30c743083b5"
AMOUNT="100000000000000"

echo "Attempting to decode the exact revert reason..."
echo ""

# Use cast to estimate gas and show error
echo "Running gas estimation (this will show the error):"
cast estimate $VAULT_ADDRESS \
    "withdraw(bytes,bytes32,bytes32,bytes32,address,uint256)" \
    $PROOF \
    $ROOT \
    $NULLIFIER_HASH \
    $CHANGE_COMMITMENT \
    $RECIPIENT \
    $AMOUNT \
    --rpc-url $RPC_URL 2>&1 | grep -A 5 -B 5 "Error\|Revert\|revert"

