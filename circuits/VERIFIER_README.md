# GhostRoute Privacy Circuit - Verifier Generation

## Current Status

**Circuit**: ✅ Compiled (`target/ghostroute_privacy_circuit.json`)
**Verifier**: ⚠️ Placeholder (`target/Verifier.sol`)

## Why Placeholder?

The Noir circuit compiles successfully, but there's a compatibility issue between:
- Nargo version: 1.0.0-beta.18
- @aztec/bb.js version: 2.1.11

The bb.js tool fails to process the circuit bytecode due to format differences between Nargo 1.0-beta18 and the current bb.js release.

## How to Generate the Real Verifier

### Option 1: Wait for Compatibility
Monitor the Noir and bb.js repositories for compatibility fixes:
- https://github.com/noir-lang/noir
- https://github.com/AztecProtocol/barretenberg

### Option 2: Use Standalone BB Binary
Download a standalone barretenberg binary from releases:
```bash
# Check releases
https://github.com/AztecProtocol/barretenberg/releases

# Download and run
bb contract --circuit target/ghostroute_privacy_circuit.json -o target/Verifier.sol
```

### Option 3: Use Docker BB
```bash
docker run --rm -v $(pwd):/app -w /app aztecprotocol/barretenberg:latest \
  bb contract --circuit target/ghostroute_privacy_circuit.json -o target/Verifier.sol
```

### Option 4: Nargo Export (if available)
```bash
nargo export
nargo verify # or similar command
```

## After Generating the Real Verifier

1. Copy the generated verifier:
   ```bash
   cp target/Verifier.sol ../ghostroute-contracts/verifiers/
   ```

2. Update the PrivacyVault contract to import and use the real verifier

3. Update the frontend ZK prover to use the real proof generation

## Circuit Information

- **ACIR Opcodes**: 72
- **Expression Width**: 1581
- **Tree Height**: 20 (1,048,576 leaves)
- **Hash Function**: Pedersen

## Public Inputs (in order)

1. `root` - Merkle tree root
2. `nullifier_hash` - Public nullifier to prevent double-spending
3. `change_commitment` - Commitment to the change note
4. `is_withdrawal` - Boolean flag (true = withdrawal, false = investment)
5. `action_hash` - H(recipient, amount) for withdrawal OR H(pool, params) for investment
6. `amount` - Withdraw or invest amount
7. `recipient` - Recipient address (ignored for investment)

## Files

- `src/main.nr` - Noir circuit source
- `target/ghostroute_privacy_circuit.json` - Compiled ACIR
- `target/Verifier.sol` - Generated Solidity verifier (placeholder)
- `scripts/generate-verifier.js` - Script to generate verifier
