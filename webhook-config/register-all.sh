#!/bin/bash

# GhostRoute Webhook Registration Script
# Registers all PrivacyVault events with the blockchain event listener

# ============================================
# Configuration - SET THESE VIA ENVIRONMENT VARIABLES
# ============================================
LISTENER_URL="${LISTENER_URL:-YOUR_LISTENER_REGISTRATION_ENDPOINT}"
DAPPS_API_KEY="${DAPPS_API_KEY:-YOUR_DAPPS_API_KEY}"
CONTRACT_ADDRESS="0x3e078e8af9aBaf8156Beca429A1d35B9398a2208"
NETWORK_ID="11577bdf-751a-44f5-aa58-c680ef643ba6"
WEBHOOK_URL="https://asjoskislowbasxamnrh.supabase.co/functions/v1/webhook"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# Validation
# ============================================
if [ "$LISTENER_URL" = "YOUR_LISTENER_REGISTRATION_ENDPOINT" ] || [ "$DAPPS_API_KEY" = "YOUR_DAPPS_API_KEY" ]; then
    echo -e "${RED}Error: LISTENER_URL and/or DAPPS_API_KEY not set${NC}"
    echo ""
    echo "Usage:"
    echo "  LISTENER_URL=https://your-listener.com/api \\"
    echo "  DAPPS_API_KEY=cli_XXX \\"
    echo "  ./register-all.sh"
    echo ""
    echo "Or create a .env file with these variables."
    exit 1
fi

echo "=========================================="
echo "GhostRoute Webhook Registration"
echo "=========================================="
echo ""
echo -e "${BLUE}Listener:${NC}  $LISTENER_URL"
echo -e "${BLUE}Contract:${NC}  $CONTRACT_ADDRESS"
echo -e "${BLUE}Network:${NC}   Sepolia ($NETWORK_ID)"
echo -e "${BLUE}Webhook:${NC}   $WEBHOOK_URL"
echo ""

# ============================================
# Helper function
# ============================================
register_event() {
    local event_name=$1
    local event_sig=$2
    local abi_json=$3

    echo -ne "${YELLOW}[$event_name]${NC} Registering... "

    local payload=$(cat <<EOF
{
  "contractAddress": "$CONTRACT_ADDRESS",
  "blockchainNetworkId": "$NETWORK_ID",
  "eventSignature": "$event_sig",
  "abiJson": "$abi_json",
  "preferredChannel": 1,
  "webhookUrl": "$WEBHOOK_URL"
}
EOF
)

    response=$(curl -s -w "\n%{http_code}" -X POST "$LISTENER_URL" \
        -H "Content-Type: application/json" \
        -H "DAPPS-API-Key: $DAPPS_API_KEY" \
        -d "$payload" 2>&1)

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED (HTTP $http_code)${NC}"
        echo "  Response: $body"
    fi
}

# ============================================
# Critical Events (3) - MUST REGISTER
# ============================================
echo "=== Critical Events (Required) ==="
echo ""

# 1. Deposit
register_event "Deposit" \
    "Deposit(bytes32,bytes32,address,uint256,uint256,bytes32)" \
    '[{\"type\":\"event\",\"name\":\"Deposit\",\"inputs\":[{\"name\":\"commitment\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"leafIndex\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":false}],\"anonymous\":false}]'

# 2. AnonymousWithdrawal (ETH)
register_event "AnonymousWithdrawal" \
    "AnonymousWithdrawal(bytes32,address,uint256,bytes32,uint256)" \
    '[{\"type\":\"event\",\"name\":\"AnonymousWithdrawal\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"recipient\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]'

# 3. AnonymousERC20Withdrawal
register_event "AnonymousERC20Withdrawal" \
    "AnonymousERC20Withdrawal(bytes32,address,address,uint256,bytes32,uint256)" \
    '[{\"type\":\"event\",\"name\":\"AnonymousERC20Withdrawal\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"token\",\"type\":\"address\",\"indexed\":true},{\"name\":\"recipient\",\"type\":\"address\",\"indexed\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]'

echo ""

# ============================================
# Recommended Events (3) - SHOULD REGISTER
# ============================================
echo "=== Recommended Events ==="
echo ""

# 4. ActionExecuted
register_event "ActionExecuted" \
    "ActionExecuted(bytes32,bytes32,bytes32,uint256,uint256,uint256)" \
    '[{\"type\":\"event\",\"name\":\"ActionExecuted\",\"inputs\":[{\"name\":\"nullifier\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"changeCommitment\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"actionHash\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"investAmount\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"timestamp\",\"type\":\"uint256\",\"indexed\":false},{\"name\":\"changeIndex\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]'

# 5. TokenAllowed
register_event "TokenAllowed" \
    "TokenAllowed(address)" \
    '[{\"type\":\"event\",\"name\":\"TokenAllowed\",\"inputs\":[{\"name\":\"token\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]'

# 6. TokenRemoved
register_event "TokenRemoved" \
    "TokenRemoved(address)" \
    '[{\"type\":\"event\",\"name\":\"TokenRemoved\",\"inputs\":[{\"name\":\"token\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]'

echo ""

# ============================================
# Optional Events (2) - NICE TO HAVE
# ============================================
echo "=== Optional Events ==="
echo ""

# 7. MerkleRootUpdated
register_event "MerkleRootUpdated" \
    "MerkleRootUpdated(bytes32,bytes32,uint256)" \
    '[{\"type\":\"event\",\"name\":\"MerkleRootUpdated\",\"inputs\":[{\"name\":\"oldRoot\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"newRoot\",\"type\":\"bytes32\",\"indexed\":true},{\"name\":\"leafCount\",\"type\":\"uint256\",\"indexed\":false}],\"anonymous\":false}]'

# 8. VerifierUpdated
register_event "VerifierUpdated" \
    "VerifierUpdated(address)" \
    '[{\"type\":\"event\",\"name\":\"VerifierUpdated\",\"inputs\":[{\"name\":\"newVerifier\",\"type\":\"address\",\"indexed\":true}],\"anonymous\":false}]'

echo ""
echo "=========================================="
echo -e "${GREEN}Registration complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Make a test deposit to verify events are received"
echo "  2. Check webhook logs: supabase functions logs webhook --tail"
echo "  3. Verify Merkle tree is being updated in the database"
echo ""
echo "Supported tokens on Sepolia:"
echo "  - ETH (address(0))"
echo "  - USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
echo "  - DAI:  0xfF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357"
echo ""
