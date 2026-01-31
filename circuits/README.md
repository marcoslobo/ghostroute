# AnonLP Privacy Circuit - Implementation Summary

## Overview
This Noir circuit implements the core ZK logic for the PrivacyVault, enabling users to prove note ownership and authorize Uniswap v4 actions without revealing their identity.

## Circuit Structure

### Data Types
- **Note**: Struct containing asset_id, amount, nullifier_secret, and blinding factor
- **Public Inputs**: root, nullifier_hash, change_commitment, action_hash, invest_amount
- **Private Inputs**: note, index, path[20], change_note

### Functions

#### compute_commitment(note: Note) -> Field
Computes a Pedersen hash commitment for a note using all four fields.

#### compute_nullifier(nullifier_secret: Field) -> Field
Derives the public nullifier hash from the secret to prevent double-spending.

#### verify_merkle_proof(leaf: Field, index: Field, path: [Field; 20]) -> Field
Manually computes the Merkle root by iteratively hashing through the 20-level path.

### Main Circuit Logic

1. **Merkle Inclusion Proof**: Verifies the note exists in the tree at the given index
2. **Nullifier Verification**: Confirms nullifier_hash is correctly derived from secret
3. **UTXO Balance Check**: Enforces input_amount == invest_amount + change_amount
4. **Asset Consistency**: Ensures change note uses same asset as input
5. **Change Commitment**: Validates the public commitment matches the change note
6. **Action Binding**: Passes through action_hash for anti-tampering (verified in contract)

## Compilation Status

✅ **Circuit compiles successfully** with `nargo compile`
✅ **All 4 tests pass**:
- test_compute_commitment
- test_compute_nullifier  
- test_utxo_balance
- test_utxo_balance_failure

## Next Steps for Integration

### Generate Solidity Verifier
To generate the Verifier.sol contract for the PrivacyVault:

```bash
# Install barretenberg (bb) tool if not already installed
# See: https://github.com/AztecProtocol/barretenberg

# 1. Compile the circuit (already done)
nargo compile

# 2. Generate verification key
bb write_vk -b ./target/anonex_privacy_circuit.json -o ./target --oracle_hash keccak

# 3. Generate Solidity verifier contract
bb write_solidity_verifier -k ./target/vk -o ./target/Verifier.sol
```

### Contract Integration
The generated Verifier.sol should be:
1. Copied to `anonex-contracts/verifiers/Verifier.sol`
2. Imported by the PrivacyVault contract
3. Used to verify proofs before processing withdrawals

### Public Inputs Order
When calling the verifier from Solidity, public inputs must be in this order:
1. root (Field)
2. nullifier_hash (Field)
3. change_commitment (Field)
4. action_hash (Field)
5. invest_amount (Field)

## Technical Details

- **Noir Version**: 1.0.0-beta.18
- **Hash Function**: Pedersen (std::hash::pedersen_hash)
- **Tree Height**: 20 levels (supporting 1,048,576 leaves)
- **Constraint Optimized**: Uses efficient Pedersen hashing

## Files

- `src/main.nr` - Main circuit implementation
- `Nargo.toml` - Package configuration
- `target/anonex_privacy_circuit.json` - Compiled ACIR circuit
- `target/Verifier.sol` - Solidity verifier (to be generated with bb)