# PrivacyVault Quickstart Guide

## Overview

PrivacyVault is a gas-efficient, privacy-preserving smart contract that enables anonymous deposits of ETH and ERC20 tokens using Permit2 and an incremental Merkle Tree.

## Prerequisites

- Solidity ^0.8.20
- Foundry framework
- Node.js 16+
- Git

## Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd ghostroute
forge install
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# PRIVATE_KEY=your_private_key
# RPC_URL=your_rpc_url
# ETHEREUM_RPC=your_ethereum_rpc
```

### 3. Compile Contracts
```bash
forge build
```

### 4. Run Tests
```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-contract PrivacyVaultTest
```

## Deployment

### 1. Deploy PrivacyVault
```bash
# Deploy to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url goerli --broadcast --verify
```

### 2. Verify Deployment
```bash
# Verify contract on Etherscan
forge verify-contract <contract-address> src/PrivacyVault.sol --chain-id 1
```

## Usage Examples

### Basic ETH Deposit

```javascript
import { ethers } from 'hardhat';

async function depositETH() {
    const privacyVault = await ethers.getContractAt("PrivacyVault", VAULT_ADDRESS);
    
    // Generate commitment off-chain
    const nullifier = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const amount = ethers.utils.parseEther("1.0");
    
    // Create commitment: H(nullifier, address(0), amount, salt)
    const commitment = await createCommitment(nullifier, address(0), amount, salt);
    
    // For ETH, no permit needed - just send with value
    const tx = await privacyVault.depositWithPermit(
        address(0),                    // ETH token address
        amount,                        // 1 ETH
        commitment,                    // Deposit commitment
        nullifier,                     // Unique nullifier
        emptyPermit,                   // Empty permit for ETH
        emptySignature                 // Empty signature for ETH
    , { value: amount });
    
    const receipt = await tx.wait();
    console.log("Deposit confirmed:", receipt.transactionHash);
    console.log("Leaf index:", receipt.events[0].args.leafIndex);
}
```

### ERC20 Deposit with Permit2

```javascript
async function depositERC20() {
    const privacyVault = await ethers.getContractAt("PrivacyVault", VAULT_ADDRESS);
    const token = await ethers.getContractAt("IERC20", TOKEN_ADDRESS);
    
    const amount = ethers.utils.parseUnits("100", 18);
    const nullifier = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    
    // Create commitment
    const commitment = await createCommitment(nullifier, TOKEN_ADDRESS, amount, salt);
    
    // Create Permit2 permit
    const permit = {
        details: {
            token: TOKEN_ADDRESS,
            amount: amount,
            expiration: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            nonce: 0
        },
        spender: VAULT_ADDRESS,
        sigDeadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    };
    
    // Sign permit
    const signature = await signPermit(permit);
    
    // Execute deposit
    const tx = await privacyVault.depositWithPermit(
        TOKEN_ADDRESS,
        amount,
        commitment,
        nullifier,
        permit,
        signature
    );
    
    const receipt = await tx.wait();
    console.log("Deposit confirmed:", receipt.transactionHash);
}
```

### Off-chain Commitment Creation

```javascript
import { createCommitment, poseidon } from './crypto-utils';

async function createCommitment(nullifier, token, amount, salt) {
    // Convert to proper format
    const tokenBN = ethers.BigNumber.from(token);
    const amountBN = ethers.BigNumber.from(amount);
    
    // Create commitment using Poseidon hash
    const commitment = poseidon([
        nullifier,
        tokenBN,
        amountBN,
        salt
    ]);
    
    return commitment;
}
```

## Testing

### Running Local Tests

```bash
# Run all tests with coverage
forge coverage

# Run specific test scenarios
forge test --match-test testDepositETH
forge test --match-test testDepositERC20WithPermit
forge test --match-test testMerkleTreeOperations
```

### Fuzz Testing

```bash
# Run fuzz tests for security validation
forge test --match-test testFuzzReplayAttack
forge test --match-test testFuzzPermit2Deposits
```

### Gas Optimization Testing

```bash
# Measure gas costs
forge test --gas-report --match-contract PrivacyVault

# Profile specific functions
forge test --match-test testInsertLeafGas --gas-snapshot
```

## Development

### Code Structure

```
src/
├── PrivacyVault.sol          # Main vault contract
├── interfaces/
│   ├── IPrivacyVault.sol     # Vault interface
│   └── IMerkleTree.sol       # Merkle tree interface
├── libraries/
│   ├── LeanIMT.sol           # Incremental Merkle tree
│   └── Poseidon.sol          # ZK-friendly hash function
└── types/
    └── Deposit.sol           # Struct definitions

tests/
├── PrivacyVault.t.sol        # Main contract tests
├── Permit2.t.sol             # Permit2 integration tests
├── MerkleTree.t.sol          # Merkle tree tests
└── integration/
    └── PrivacyVaultIntegration.t.sol  # Full workflow tests
```

### Adding New Tests

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PrivacyVault.sol";

contract NewFeatureTest is Test {
    PrivacyVault private vault;
    
    function setUp() public {
        vault = new PrivacyVault();
    }
    
    function testNewFeature() public {
        // Your test implementation
    }
}
```

## Security Considerations

### Constitutional Compliance

This implementation follows GhostRoute constitutional requirements:

- ✅ **Privacy by Default**: Zero-knowledge proof architecture
- ✅ **Economic Integrity**: Atomic transaction handling
- ✅ **Security Testing**: 100% branch coverage requirement
- ✅ **Formal Verification Ready**: Clear, auditable code structure

### Security Best Practices

1. **Never reuse nullifiers** - This enables double-spending detection
2. **Use fresh salts** - Ensures commitment uniqueness
3. **Validate permit expiration** - Prevents stale permit usage
4. **Check tree capacity** - Prevents overflow attacks
5. **Monitor gas costs** - Ensures efficiency targets are met

### Audit Checklist

- [ ] All nullifiers are properly tracked
- [ ] Merkle tree operations are atomic
- [ ] Permit2 integration is secure
- [ ] Gas costs are within targets
- [ ] 100% test coverage achieved
- [ ] Fuzz tests pass
- [ ] Integration tests comprehensive

## Troubleshooting

### Common Issues

**Permit2 Signature Fails**
```javascript
// Ensure signature uses correct EIP-712 domain
const domain = {
    name: "Permit2",
    chainId: await signer.getChainId(),
    verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3"
};
```

**Merkle Tree Verification Fails**
```javascript
// Ensure proof array contains correct number of elements
// Height 20 tree needs 20 proof elements
const proofLength = treeHeight; // Should be 20
```

**Gas Costs Too High**
```solidity
// Check for unnecessary storage operations
// Use packed structs where possible
// Optimize loop operations
```

## Support

For issues and questions:

1. Check the test files for usage examples
2. Review the API specification in `contracts/api.md`
3. Consult the data model in `data-model.md`
4. Reference the constitution for compliance requirements

## Next Steps

After completing the PrivacyVault implementation:

1. Implement ZK proof verification for withdrawals
2. Add Action Adapters for Uniswap v4 integration
3. Develop governance mechanism for adapter whitelisting
4. Conduct formal verification of critical components
5. Prepare for security audit