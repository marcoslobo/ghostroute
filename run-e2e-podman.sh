#!/bin/bash

# E2E Test Runner for ghostroute using Podman
# This script sets up the full environment and runs end-to-end tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
CONTRACTS_DIR="$PROJECT_ROOT/ghostroute-contracts"

echo "========================================"
echo "GHOSTROUTE ZK API - E2E Test Runner (Podman)"
echo "========================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    podman compose -f docker-compose.e2e.yml down --volumes --remove-orphans 2>/dev/null || true
    if [ ! -z "$ANVIL_PID" ]; then
        kill $ANVIL_PID 2>/dev/null || true
        echo "Anvil stopped"
    fi
    echo -e "${GREEN}Cleanup complete${NC}"
}

trap cleanup EXIT

echo -e "\n${YELLOW}[1/4] Checking prerequisites...${NC}"

if ! command -v podman &> /dev/null; then
    echo -e "${RED}Podman not found. Please install Podman first.${NC}"
    exit 1
fi

if ! command -v deno &> /dev/null; then
    echo -e "${RED}Deno not found. Installing...${NC}"
    curl -fsSL https://deno.land/install.sh | sh
    export PATH="$HOME/.deno/bin:$PATH"
fi

echo -e "${GREEN}All prerequisites met!${NC}"

echo -e "\n${YELLOW}[2/4] Starting services with Podman Compose...${NC}"

cd "$PROJECT_ROOT"

if ! curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545 > /dev/null 2>&1; then
    echo "Starting Anvil on host..."
    cd "$PROJECT_ROOT/ghostroute-contracts"
    anvil > /dev/null 2>&1 &
    ANVIL_PID=$!
    cd "$PROJECT_ROOT"
    echo "Anvil started (PID: $ANVIL_PID)"
    sleep 3
else
    echo "Anvil already running on host"
fi

if ! podman network inspect ghostroute-network &>/dev/null; then
    echo "Creating ghostroute-network..."
    podman network create ghostroute-network
else
    echo "Network ghostroute-network already exists"
fi

podman compose -f docker-compose.e2e.yml down --volumes --remove-orphans 2>/dev/null || true

podman compose -f docker-compose.e2e.yml up -d

echo "Waiting for Anvil to be ready..."
for i in {1..30}; do
    if curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545 > /dev/null 2>&1; then
        echo -e "${GREEN}Anvil is ready!${NC}"
        break
    fi
    sleep 1
done

echo "Waiting for PostgreSQL to be ready..."
for i in {1..60}; do
    if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL is ready!${NC}"
        break
    fi
    sleep 2
done

echo -e "\n${YELLOW}[3/4] Running E2E tests...${NC}"

export PATH="$HOME/.deno/bin:$PATH"
export ANVIL_URL="http://127.0.0.1:8545"
export POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/postgres"
export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
export CHAIN_ID="31337"

cd "$PROJECT_ROOT/ghostroute-zk-api"

if [ ! -f "supabase/migrations/001_initial_schema.sql" ]; then
    echo "Warning: Migration file not found, database may not be initialized"
else
    echo "Running database migrations..."
    podman exec -i ghostroute-postgres psql -U postgres -d postgres < supabase/migrations/001_initial_schema.sql 2>/dev/null || true
fi

deno run --allow-all scripts/e2e-test.ts

echo -e "\n${YELLOW}[4/4] Test completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}E2E Test Runner Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
