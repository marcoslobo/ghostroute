#!/bin/bash

# ============================================
# GhostRoute Deployment Helper Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTRACTS_DIR="/home/marcos-lobo/projetos/hackathons/anonex/ghostroute-contracts"
DEPLOYMENTS_DIR="$CONTRACTS_DIR/deployments"

# Default settings
NETWORK="anvil"
PRIVATE_KEY=""
RPC_URL=""
VERIFY=false
VERBOSE=false

# ============================================
# Helper Functions
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=============================================="
    echo "  $1"
    echo "=============================================="
}

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --network NETWORK   Network to deploy to (anvil, sepolia, base, base-sepolia, eth)"
    echo "  -k, --private-key KEY  Private key for deployment"
    echo "  -r, --rpc-url URL      RPC URL for the network"
    echo "  -v, --verify           Verify contracts on explorer"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --network anvil"
    echo "  $0 --network sepolia --private-key 0x..."
    echo "  $0 --network base --verify"
}

load_env() {
    if [ -f "$CONTRACTS_DIR/.env" ]; then
        log_info "Loading environment from .env file..."
        set -a
        source "$CONTRACTS_DIR/.env"
        set +a
    fi
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v forge &> /dev/null; then
        log_error "Foundry (forge) is not installed"
        log_info "Install with: curl -L https://foundry.paradigm.xyz | bash"
        exit 1
    fi
    
    log_success "All dependencies satisfied"
}

build_contracts() {
    log_info "Building contracts..."
    cd "$CONTRACTS_DIR"
    forge build
    log_success "Contracts built successfully"
}

get_network_config() {
    case $NETWORK in
        anvil)
            RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
            CHAIN_ID=31337
            ;;
        sepolia)
            RPC_URL="${RPC_URL:-https://rpc.sepolia.org}"
            CHAIN_ID=11155111
            ;;
        base)
            RPC_URL="${RPC_URL:-https://mainnet.base.org}"
            CHAIN_ID=8453
            ;;
        base-sepolia)
            RPC_URL="${RPC_URL:-https://sepolia.base.org}"
            CHAIN_ID=84532
            ;;
        eth|ethereum)
            RPC_URL="${RPC_URL:-https://eth.llamarpc.com}"
            CHAIN_ID=1
            ;;
        *)
            log_error "Unknown network: $NETWORK"
            exit 1
            ;;
    esac
    
    log_info "Network: $NETWORK (Chain ID: $CHAIN_ID)"
    log_info "RPC URL: $RPC_URL"
}

check_private_key() {
    if [ -z "$PRIVATE_KEY" ]; then
        PRIVATE_KEY="$PRIVATE_KEY_ANVIL"
    fi
    
    if [ -z "$PRIVATE_KEY" ]; then
        log_error "Private key not set. Use --private-key or set PRIVATE_KEY in .env"
        exit 1
    fi
    
    # Validate private key format
    if [[ ! "$PRIVATE_KEY" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
        log_error "Invalid private key format. Must be 66 characters (0x + 64 hex chars)"
        exit 1
    fi
    
    log_info "Private key configured"
}

deploy_contracts() {
    print_header "Deploying Contracts to $NETWORK"
    
    cd "$CONTRACTS_DIR"
    
    local cmd="forge script script/DeployAll.s.sol --rpc-url $RPC_URL --chain $CHAIN_ID --broadcast"
    
    if [ "$VERIFY" = true ]; then
        cmd="$cmd --verify -vvvv"
    fi
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd -vvvvv"
    fi
    
    eval $cmd
    
    log_success "Deployment complete!"
}

check_deployment_status() {
    local deployment_file="$DEPLOYMENTS_DIR/$CHAIN_ID.json"
    
    if [ -f "$deployment_file" ]; then
        print_header "Deployment Status"
        cat "$deployment_file"
    else
        log_warn "No deployment found for Chain ID $CHAIN_ID"
    fi
}

verify_contract() {
    local contract_address=$1
    local contract_name=$2
    
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        log_warn "ETHERSCAN_API_KEY not set. Skipping verification."
        return
    fi
    
    log_info "Verifying $contract_name at $contract_address..."
    
    cd "$CONTRACTS_DIR"
    forge verify-contract --chain-id $CHAIN_ID --etherscan-api-key $ETHERSCAN_API_KEY $contract_address $contract_name
}

# ============================================
# Main Execution
# ============================================

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--network)
                NETWORK="$2"
                shift 2
                ;;
            -k|--private-key)
                PRIVATE_KEY="$2"
                shift 2
                ;;
            -r|--rpc-url)
                RPC_URL="$2"
                shift 2
                ;;
            -v|--verify)
                VERIFY=true
                shift
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    print_header "GhostRoute Contract Deployment"
    
    # Load environment
    load_env
    
    # Check dependencies
    check_dependencies
    
    # Get network configuration
    get_network_config
    
    # Check private key
    check_private_key
    
    # Build contracts
    build_contracts
    
    # Deploy contracts
    deploy_contracts
    
    # Show deployment status
    check_deployment_status
    
    print_header "Done!"
    echo ""
    echo "To interact with deployed contracts:"
    echo "  1. Check deployments/$CHAIN_ID.json for contract addresses"
    echo "  2. Update your frontend/config with new addresses"
    echo ""
}

# Run main function
main "$@"
