#!/bin/bash

# GhostRoute Webhook Registration Script
# This script registers all PrivacyVault events with your external webhook listener

# Configuration - UPDATE THESE VALUES
LISTENER_URL="YOUR_LISTENER_REGISTRATION_ENDPOINT"  # e.g., https://listener.example.com/api/register
SEPOLIA_NETWORK_UUID="YOUR_SEPOLIA_NETWORK_UUID"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if configuration is set
if [ "$LISTENER_URL" = "YOUR_LISTENER_REGISTRATION_ENDPOINT" ] || [ "$SEPOLIA_NETWORK_UUID" = "YOUR_SEPOLIA_NETWORK_UUID" ]; then
    echo -e "${RED}Error: Please update LISTENER_URL and SEPOLIA_NETWORK_UUID in this script${NC}"
    echo "Edit this file and set the correct values at the top"
    exit 1
fi

echo "=========================================="
echo "GhostRoute Webhook Registration"
echo "=========================================="
echo ""
echo "Listener URL: $LISTENER_URL"
echo "Network UUID: $SEPOLIA_NETWORK_UUID"
echo "Contract: 0xAbf1Eec57F6A8961af7e517FF955eD7A409Cc2A4"
echo ""

# Function to register an event
register_event() {
    local event_name=$1
    local json_file=$2

    echo -e "${YELLOW}Registering $event_name...${NC}"

    # Replace placeholders in JSON
    local payload=$(cat "$json_file" | sed "s/YOUR_SEPOLIA_NETWORK_UUID/$SEPOLIA_NETWORK_UUID/g")

    # Send POST request
    response=$(curl -s -w "\n%{http_code}" -X POST "$LISTENER_URL" \
        -H "Content-Type: application/json" \
        -d "$payload")

    # Extract HTTP code
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ $event_name registered successfully${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗ Failed to register $event_name (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi

    echo ""
}

# Register critical events
echo "=== Critical Events (Required) ==="
echo ""
register_event "Deposit" "register-deposit.json"
register_event "ActionExecuted" "register-action-executed.json"

# Register optional events
echo "=== Optional Events ==="
echo ""
register_event "MerkleRootUpdated" "register-merkle-root-updated.json"
register_event "VerifierUpdated" "register-verifier-updated.json"

echo "=========================================="
echo "Registration Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test by making a deposit to the PrivacyVault contract"
echo "2. Check webhook logs: supabase functions logs webhook --tail"
echo "3. Verify events are being received and processed"
