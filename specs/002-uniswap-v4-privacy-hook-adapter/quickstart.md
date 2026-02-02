# Quickstart: Uniswap v4 Privacy Hook Adapter

## Overview

This guide walks you through deploying and using the Uniswap v4 Privacy Hook Adapter, which enables privacy-preserving liquidity addition using ZK-proof validation.

## Prerequisites

- Solidity ^0.8.24+
- Foundry for testing and deployment
- Uniswap v4 Core and Periphery contracts
- PrivacyVault (001) deployed
- Noir toolchain for proof generation (optional for integration)

## Installation

### 1. Install Dependencies

```bash
# Install v4-core
forge install Uniswap/v4-core

# Install v4-periphery
forge install Uniswap/v4-periphery

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Build Contracts

```bash
forge build
```

## Deployment

### Step 1: Mine Hook Address

The hook address must have specific bits set. Use the HookMiner utility:

```bash
# Run mining script
forge script script/MineHookAddress.s.sol --broadcast
```

**Script Example:**
```solidity
// script/MineHookAddress.s.sol
contract MineHookAddress is Script {
    function run() external {
        uint160 flags = uint160(
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG
        );
        
        bytes memory constructorArgs = abi.encode(
            POOL_MANAGER_ADDRESS,
            PRIVACY_VAULT_ADDRESS
        );
        
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(PrivacyLiquidityHook).creationCode,
            constructorArgs
        );
        
        console.log("Hook Address:", hookAddress);
        console.logBytes32(salt);
    }
}
```

### Step 2: Deploy Hook

```bash
forge script script/DeployHook.s.sol --broadcast --rpc-url $RPC_URL
```

**Deployment Parameters:**
- `poolManager`: Address of Uniswap v4 PoolManager
- `privacyVault`: Address of the PrivacyVault contract

**Example Deployment:**
```solidity
PrivacyLiquidityHook hook = new PrivacyLiquidityHook{salt: salt}(
    IPoolManager(0x...),  // PoolManager address
    0x...                  // PrivacyVault address
);
```

## Usage

### Step 1: Compute Action Hash

Before generating a ZK-proof, compute the action hash:

```solidity
// User interface or SDK
PoolKey memory key = PoolKey({
    currency0: Currency.wrap(0x...),  // Token0 address
    currency1: Currency.wrap(0x...),  // Token1 address
    fee: 3000,                         // 0.3% fee tier
    tickSpacing: 60,
    hooks: IHooks(hookAddress)
});

IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
    tickLower: -600,        // Price range lower bound
    tickUpper: 600,         // Price range upper bound
    liquidityDelta: 1000e18, // Amount of liquidity to add
    salt: bytes32(0)
});

address recipient = 0x...; // Address receiving the position

bytes32 actionHash = hook.computeActionHash(key, params, recipient);
// Use this hash in your Noir circuit to generate the proof
```

### Step 2: Generate ZK-Proof (Off-chain)

Use Noir to generate a proof with the action hash as public input:

```rust
// main.nr
fn main(
    action_hash: pub Field,  // Computed from computeActionHash
    // ... other private inputs
) {
    // Circuit validates the user owns the funds and can add liquidity
    // ...
}
```

```bash
# Generate proof
nargo prove --name my_proof
```

### Step 3: Execute Privacy Liquidity Addition

Call through the PrivacyVault:

```solidity
// User calls PrivacyVault
bytes memory proof = /* generated proof bytes */;
bytes32[] memory publicInputs = new bytes32[](1);
publicInputs[0] = actionHash;

// PrivacyVault validates proof and calls the hook
privacyVault.executeAction(
    actionHash,
    proof,
    abi.encode(key, params, recipient)
);
```

### Complete Integration Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrivacyLiquidityHook} from "src/hooks/PrivacyLiquidityHook.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract ExampleUsage {
    PrivacyLiquidityHook public hook;
    
    function addLiquidityPrivately() external {
        // 1. Setup pool key
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // 2. Setup liquidity params
        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: -600,
            tickUpper: 600,
            liquidityDelta: 1000e18,
            salt: bytes32(0)
        });
        
        // 3. Compute action hash (off-chain)
        bytes32 actionHash = hook.computeActionHash(key, params, msg.sender);
        
        // 4. Generate ZK-proof with Noir (off-chain)
        // ... proof generation happens off-chain ...
        bytes memory proof = /* your proof */;
        bytes32[] memory publicInputs = new bytes32[](1);
        publicInputs[0] = actionHash;
        
        // 5. Call PrivacyVault to execute
        // The Vault validates the proof, sets transient authorization,
        // and calls the hook to add liquidity
        privacyVault.executeAction(
            actionHash,
            proof,
            abi.encode(key, params, msg.sender)
        );
    }
}
```

## Testing

### Run Tests

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testPrivacyLiquidityAddition
```

### Test Coverage

Target: 100% branch coverage

```bash
forge coverage
```

## Integration with Existing PrivacyVault

The hook integrates with the 001-privacy-vault feature:

```solidity
// PrivacyVault calls the hook after proof validation
contract PrivacyVault {
    PrivacyLiquidityHook public hook;
    
    function executeAction(
        bytes32 actionHash,
        bytes calldata proof,
        bytes calldata data
    ) external {
        // 1. Validate ZK-proof
        require(verifyProof(actionHash, proof), "Invalid proof");
        
        // 2. Decode action data
        (PoolKey memory key, IPoolManager.ModifyLiquidityParams memory params, address recipient) = 
            abi.decode(data, (PoolKey, IPoolManager.ModifyLiquidityParams, address));
        
        // 3. Set transient authorization
        bytes32 slot = keccak256("ghostroute.privacy.authorized");
        address target = recipient;
        assembly {
            tstore(slot, target)
        }
        
        // 4. Call hook to add liquidity
        hook.addLiquidityWithPrivacy(key, params, proof, new bytes32[](0));
    }
}
```

## Troubleshooting

### Hook Callback Not Called

**Problem:** `beforeAddLiquidity` not executing

**Solution:** Verify hook address has correct permission bits:
```solidity
bool hasPermission = uint160(address(hook)) & Hooks.BEFORE_ADD_LIQUIDITY_FLAG != 0;
require(hasPermission, "Hook address missing permission bits");
```

### Unauthorized Error

**Problem:** `UnauthorizedLiquidityAddition` revert

**Solution:** Check that:
1. PrivacyVault set transient storage before calling hook
2. Transient storage slot matches expected slot
3. Transaction hasn't ended (transient storage cleared)

### Gas Estimation Issues

**Problem:** Transactions failing with out of gas

**Solution:** The full flow requires ~200k gas. Ensure sufficient gas limit.

## Security Checklist

- [ ] Hook deployed with correct address bits
- [ ] PrivacyVault address correctly set
- [ ] Transient storage slot standardized
- [ ] Noir circuit action hash encoding matches Solidity
- [ ] Only PrivacyVault can call addLiquidityWithPrivacy
- [ ] Hook callbacks only callable by PoolManager
- [ ] No persistent state in hook (only transient)
- [ ] 100% test coverage achieved
- [ ] Fuzzing tests passing
- [ ] Integration tests with PoolManager passing

## Next Steps

1. Deploy to testnet
2. Integrate with frontend/SDK
3. Add monitoring for PrivacyLiquidityAdded events
4. Document Noir circuit integration
5. Perform security audit

## Resources

- [Uniswap v4 Documentation](https://docs.uniswap.org/contracts/v4)
- [EIP-1153 Transient Storage](https://eips.ethereum.org/EIPS/eip-1153)
- [Noir Documentation](https://noir-lang.org/docs)
- [PrivacyVault Specification](../001-privacy-vault/spec.md)
