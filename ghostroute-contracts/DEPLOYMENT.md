# GhostRoute Smart Contract Deployment Guide

## Overview

This guide covers deploying GhostRoute smart contracts to various networks using Foundry.

## Prerequisites

- **Foundry** (Forge, Cast, Anvil)
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```

- **Private Key** of a funded deployer account
- **RPC URL** for the target network (optional for local Anvil)

## Quick Start

### 1. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```bash
# Private key (use a test account for testnets!)
PRIVATE_KEY="0x..."

# RPC URL (optional - auto-selected by network)
RPC_URL="https://rpc.sepolia.org"

# Etherscan API key for contract verification
ETHERSCAN_API_KEY="your-api-key"
```

### 2. Build Contracts

```bash
forge build
```

### 3. Deploy

#### Local Anvil (Development)

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy
export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
forge script script/DeployAll.s.sol --broadcast
```

#### Sepolia Testnet

```bash
export RPC_URL="https://rpc.sepolia.org"
export PRIVATE_KEY="0x..."
forge script script/DeployAll.s.sol --rpc-url $RPC_URL --broadcast --verify
```

#### Base Mainnet

```bash
export RPC_URL="https://mainnet.base.org"
export PRIVATE_KEY="0x..."
forge script script/DeployAll.s.sol --rpc-url $RPC_URL --broadcast --verify
```

## Deployment Scripts

### DeployAll.s.sol (Main Script)

Deploys all GhostRoute contracts:

```bash
forge script script/DeployAll.s.sol --rpc-url $RPC_URL --broadcast
```

**Deploys:**
1. `MockZKVerifier` - Mock verifier for testing
2. `PrivacyVault` - Main vault contract
3. `PrivacyLiquidityHook` - Uniswap v4 hook (if PoolManager configured)

### DeployPrivacyVault.s.sol (Vault Only)

Deploy just the PrivacyVault:

```bash
forge script script/DeployPrivacyVault.s.sol --rpc-url $RPC_URL --broadcast
```

### DeployHook.s.sol (Hook Only)

Deploy just the hook (requires PoolManager and Vault addresses):

```bash
# Set addresses in the script or via environment
export POOL_MANAGER="0x..."
export PRIVACY_VAULT="0x..."
forge script script/DeployHook.s.sol --rpc-url $RPC_URL --broadcast
```

## Using the Helper Script

```bash
# Make executable
chmod +x scripts/deploy.sh

# Deploy to Anvil
./scripts/deploy.sh --network anvil

# Deploy to Sepolia with verification
./scripts/deploy.sh --network sepolia --private-key 0x... --verify

# Deploy to Base
./scripts/deploy.sh --network base --verify
```

## Supported Networks

| Network | Chain ID | RPC URL | Notes |
|---------|----------|---------|-------|
| Anvil | 31337 | http://127.0.0.1:8545 | Local development |
| Sepolia | 11155111 | https://rpc.sepolia.org | Ethereum testnet |
| Base | 8453 | https://mainnet.base.org | L2 mainnet |
| Base Sepolia | 84532 | https://sepolia.base.org | L2 testnet |
| Ethereum | 1 | https://eth.llamarpc.com | Mainnet |

## Deployment Outputs

Deployments are saved to `deployments/{chainId}.json`:

```json
{
  "verifier": "0x...",
  "vault": "0x...",
  "hook": "0x...",
  "timestamp": 1234567890,
  "chainId": 11155111,
  "network": "Sepolia"
}
```

## Contract Addresses

### Anvil (31337)
```
MockZKVerifier:        0x...
PrivacyVault:          0x...
PrivacyLiquidityHook:  (skipped - no PoolManager)
```

### Sepolia (11155111)
```
MockZKVerifier:        0x...
PrivacyVault:          0x...
PrivacyLiquidityHook:  0x...
```

## Verifying Contracts

### Automatic Verification

Add `--verify` flag to deployment:

```bash
forge script script/DeployAll.s.sol --rpc-url $RPC_URL --verify
```

### Manual Verification

```bash
forge verify-contract CONTRACT_ADDRESS ContractName --chain-id CHAIN_ID
```

## Troubleshooting

### "PoolManager address not set"

For non-local networks, you need to configure the PoolManager address in `DeployAll.s.sol` or `DeployHook.s.sol`.

### "Deployer has no balance"

Make sure your deployer account has native tokens for the target network.

### "Chain not configured"

The network may not be in the configuration. Update `DeployAll.s.sol` with your network details.

### Verification fails

- Check `ETHERSCAN_API_KEY` is correct
- Ensure contract source is published
- Try with `--force` flag

## Security Notes

1. **Never commit private keys** - Use `.env` and `.gitignore`
2. **Use test accounts** on testnets
3. **Verify contract source** on explorers
4. **Test thoroughly** on testnets before mainnet
5. **Use multi-sig** for production deployments

## Next Steps

After deployment:

1. Update frontend configuration with new contract addresses
2. Set up event indexing (webhook processor)
3. Configure monitoring and alerts
4. Run integration tests
5. Prepare documentation for users
