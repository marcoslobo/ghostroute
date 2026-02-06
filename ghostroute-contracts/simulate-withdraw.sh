#!/bin/bash

VAULT_ADDRESS="0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"
CALLER="0x34EdEB37D1D133705B829bC21Db3F30c743083b5"

# Parameters
PROOF="0x00"
ROOT="0x4131e0af671c3c15d03879ead37b949e3c3ad43b04ac6decffbd55f0997e488f"
NULLIFIER_HASH="0xe0dc759fa46a20855ab43b3a33ebd90b8c7746d7302d509df62d69aced1a3fb6"
CHANGE_COMMITMENT="0x1c0fa973e2c743b567cb3b01c5b1e9844711de6ed36bc749f18f3feca2b24403"
RECIPIENT="0x34EdEB37D1D133705B829bC21Db3F30c743083b5"
AMOUNT="100000000000000"

echo "Simulating withdraw transaction..."
echo "From: $CALLER"
echo ""

# Try to simulate the call
cast call $VAULT_ADDRESS \
    "withdraw(bytes,bytes32,bytes32,bytes32,address,uint256)" \
    $PROOF \
    $ROOT \
    $NULLIFIER_HASH \
    $CHANGE_COMMITMENT \
    $RECIPIENT \
    $AMOUNT \
    --from $CALLER \
    --rpc-url $RPC_URL \
    --trace 2>&1 | head -50

