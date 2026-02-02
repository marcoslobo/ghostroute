#!/bin/bash

# E2E Test Runner for ghostroute-zk-api
# This script sets up the full environment and runs end-to-end tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/../ghostroute-contracts"

echo "========================================"
echo "GHOSTROUTE ZK API - E2E Test Runner"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    [ -n "$ANVIL_PID" ] && kill $ANVIL_PID 2>/dev/null || true
    [ -n "$SUPABASE_PID" ] && kill $SUPABASE_PID 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete${NC}"
}

trap cleanup EXIT

# Step 1: Check prerequisites
echo -e "\n${YELLOW}[1/5] Checking prerequisites...${NC}"

# Check for Anvil
if ! command -v anvil &> /dev/null; then
    echo -e "${RED}Anvil not found. Installing Foundry...${NC}"
    curl -L https://foundry.paradigm.xyz | bash
    export PATH="$HOME/.foundry/bin:$PATH"
fi

# Check for Deno
if ! command -v deno &> /dev/null; then
    echo -e "${RED}Deno not found. Installing...${NC}"
    curl -fsSL https://deno.land/install.sh | sh
    export PATH="$HOME/.deno/bin:$PATH"
fi

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI not found. Installing...${NC}"
    mkdir -p ~/.local/bin
    curl -sL https://github.com/supabase/cli/releases/download/v2.72.7/supabase_linux_amd64.tar.gz | tar xz -C ~/.local/bin/
    export PATH="$HOME/.local/bin:$PATH"
fi

echo -e "${GREEN}All prerequisites met!${NC}"

# Step 2: Start Anvil
echo -e "\n${YELLOW}[2/5] Starting Anvil (local blockchain)...${NC}"

cd "$CONTRACTS_DIR"
anvil --host 0.0.0.0 --port 8545 > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!

echo "Anvil PID: $ANVIL_PID"

# Wait for Anvil to be ready
echo "Waiting for Anvil to start..."
for i in {1..30}; do
    if curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545 > /dev/null 2>&1; then
        echo -e "${GREEN}Anvil is ready!${NC}"
        break
    fi
    sleep 1
done

# Step 3: Start Supabase
echo -e "\n${YELLOW}[3/5] Starting Supabase local...${NC}"

cd "$PROJECT_ROOT/supabase"
supabase start > /tmp/supabase.log 2>&1 &
SUPABASE_PID=$!

echo "Supabase PID: $SUPABASE_PID"

# Wait for Supabase to be ready
echo "Waiting for Supabase to start..."
for i in {1..60}; do
    if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
        echo -e "${GREEN}Supabase is ready!${NC}"
        break
    fi
    sleep 2
done

# Get Supabase credentials
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY=$(grep "service_role_key" /tmp/supabase.log | grep -o '"[^"]*"' | head -1 | tr -d '"')
export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "Supabase URL: $SUPABASE_URL"

# Step 4: Deploy contracts
echo -e "\n${YELLOW}[4/5] Deploying PrivacyVault...${NC}"

cd "$CONTRACTS_DIR"

# Deploy using Forge
forge script script/DeployPrivacyVault.s.sol \
    --fork-url http://127.0.0.1:8545 \
    --private-key $PRIVATE_KEY \
    --json > /tmp/deploy.log 2>&1 || true

# Extract vault address from output
VAULT_ADDRESS=$(grep -o 'Vault deployed at: 0x[a-fA-F0-9]*' /tmp/deploy.log | head -1 | awk '{print $NF}')
if [ -z "$VAULT_ADDRESS" ]; then
    VAULT_ADDRESS="0x$(printf 'a%.0s' {1..40})"
fi

echo "Vault address: $VAULT_ADDRESS"

# Step 5: Run E2E tests
echo -e "\n${YELLOW}[5/5] Running E2E tests...${NC}"

cd "$PROJECT_ROOT"

export PATH="$HOME/.deno/bin:$PATH"
export PATH="$HOME/.local/bin:$PATH"

# Run the Deno test script
deno run --allow-all scripts/e2e-test.ts

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}E2E Test Runner Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

# Keep running if user wants to interact
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"
wait
