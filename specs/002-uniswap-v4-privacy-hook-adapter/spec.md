# Feature Specification: Uniswap v4 Privacy Hook Adapter

## Overview
Develop a Uniswap v4 Hook that acts as a privacy-preserving liquidity adapter, enabling users to add liquidity to Uniswap v4 pools using funds from the PrivacyVault without revealing the source of funds.

## Functional Requirements

### 1. Hook Architecture
- **Inherit from BaseHook**: The adapter must inherit from Uniswap v4's BaseHook contract
- **Hook Permissions**: Configure hook permissions to enable `beforeAddLiquidity` callback
- **Pool Manager Integration**: Integrate with Uniswap v4's PoolManager for liquidity operations

### 2. Privacy Verification via EIP-1153
- **Transient Storage**: Implement EIP-1153 (Transient Storage) to verify that the liquidity request originates from a pre-authorized ZK-proof validation in the PrivacyVault
- **Validation Slot**: Use a transient storage slot to store proof validation status
- **Authorization Check**: The `beforeAddLiquidity` hook must verify that the caller has been authorized via ZK-proof validation within the same transaction

### 3. Asset Settlement Flow
- **Settle Operation**: Implement proper handling of the 'Settle' flow to pull assets from the PrivacyVault to the PoolManager
- **Atomic Execution**: Ensure the liquidity addition is atomic - if settlement fails, the entire transaction reverts
- **Token Transfers**: Handle both ERC20 tokens and native ETH transfers from Vault to PoolManager

### 4. Circuit Alignment
- **actionHash Computation**: Include a public function to compute the actionHash of the pool parameters
- **Noir Circuit Compatibility**: Ensure perfect alignment with the Noir circuit's public inputs for ZK-proof generation
- **Parameter Encoding**: Define standard encoding for pool parameters (tick range, amounts, recipient, etc.)

## Technical Context

### Dependencies
- Solidity ^0.8.20
- Uniswap v4 Core contracts (BaseHook, PoolManager, etc.)
- OpenZeppelin Contracts
- EIP-1153 (Transient Storage) support
- Existing PrivacyVault (001-privacy-vault) integration

### Interface Requirements

#### Hook Functions
- `beforeAddLiquidity(address sender, PoolKey calldata key, IPoolManager.ModifyLiquidityParams calldata params, bytes calldata hookData)`: Validates ZK-proof authorization via transient storage

#### Public Functions
- `computeActionHash(PoolKey calldata key, ModifyLiquidityParams calldata params, address recipient)`: Computes the action hash for ZK-proof verification
- `addLiquidityWithPrivacy(PoolKey calldata key, ModifyLiquidityParams calldata params, bytes calldata proof, bytes32[] calldata publicInputs)`: Entry point for privacy-preserving liquidity addition

### State Management
- Transient storage slot for proof validation status
- No persistent state required (stateless hook design)

## Security Considerations
- Reentrancy protection
- Proper access control (only callable by authorized parties)
- Validation of pool parameters
- Prevention of front-running attacks
- Atomic execution guarantees

## Testing Requirements
- 100% branch coverage for hook logic
- Integration tests with PoolManager
- Fuzzing tests for edge cases
- Mock implementations for ZK-proof verification
