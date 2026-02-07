#!/bin/bash

VAULT_ADDRESS="0x3e078e8af9aBaf8156Beca429A1d35B9398a2208"
RPC_URL="https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef"

echo "Checking deployed contract bytecode..."
echo ""

# Get bytecode size
CODE=$(cast code $VAULT_ADDRESS --rpc-url $RPC_URL)
CODE_SIZE=${#CODE}

echo "Deployed contract bytecode size: $CODE_SIZE bytes"
echo ""

# Compile local contract and check size
echo "Compiling local contract..."
forge build --quiet 2>/dev/null

if [ -f "out/PrivacyVault.sol/PrivacyVault.json" ]; then
    LOCAL_SIZE=$(jq -r '.deployedBytecode.object' out/PrivacyVault.sol/PrivacyVault.json | wc -c)
    echo "Local compiled bytecode size: $LOCAL_SIZE bytes"
    echo ""
    
    DIFF=$((CODE_SIZE - LOCAL_SIZE))
    echo "Difference: $DIFF bytes"
    echo ""
    
    if [ $DIFF -gt 1000 ] || [ $DIFF -lt -1000 ]; then
        echo "⚠️  WARNING: Significant size difference!"
        echo "The deployed contract may be a different version."
        echo ""
        echo "Recommendation: Deploy a fresh contract"
    else
        echo "✅ Sizes are similar - likely same version"
        echo ""
        echo "But deploying a fresh contract is still a good idea to:"
        echo "  - Get a clean state"
        echo "  - Test deposit + withdraw flow from scratch"
    fi
fi

echo ""
echo "=========================================="
echo "RECOMMENDATION: Deploy fresh contract"
echo "=========================================="
echo ""
echo "Steps:"
echo "1. Deploy new PrivacyVault with MockZKVerifier"
echo "2. Update .env with new address"
echo "3. Make a test deposit (0.0001 ETH)"
echo "4. Try withdraw immediately"
echo ""

