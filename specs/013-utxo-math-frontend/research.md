# Research: UTXO Math for React Frontend

## Decision 1: Gas Estimation Strategy

**Decision**: Hybrid gas estimation approach using RPC estimation with historical fallback

### Details
- **Primary method**: `viem.estimateContractGas()` for PrivacyVault.executeAction
- **Fallback**: Historical data (~200,000 gas for executeAction)
- **Buffer**: 15-20% safety margin

### Rationale
- ExecuteAction has predictable gas costs (~195k-220k) due to deterministic ZK proof verification
- RPC estimation can fail for complex transactions; fallback prevents UX issues
- Buffer accounts for gas price fluctuations and EIP-1559 tip adjustments

### Gas Estimates
| Operation | Base Gas | With Buffer |
|-----------|----------|-------------|
| executeAction | 200,000 | 230,000 |
| deposit | 130,000 | 145,000 |

### Alternatives Considered
- Pure static estimation: Rejected (doesn't account for gas prices)
- Tenderly simulation: Rejected (adds external dependency, overkill)

---

## Decision 2: Poseidon Hash Parameters

**Decision**: Standardize on Poseidon hash across all components with poseidon-lite

### Configuration
- **Library**: `poseidon-lite`
- **Field**: BN254 (matches Ethereum and Noir)
- **t (arity)**: 3 (three-input hash)
- **Alpha**: 5 (standard S-box exponent)

### Cross-System Compatibility
| Component | Hash Function | Notes |
|-----------|---------------|-------|
| Noir Circuit | Poseidon | Using `std::hash::poseidon_hash` |
| Solidity | @zk-kit/lean-imt | Native Poseidon |
| TypeScript | poseidon-lite | BN254 field, t=3 |

### Rationale
- ZK-friendly design across all system components
- Audit trail via @zk-kit/lean-imt (Semaphore V4 PSE audit)
- Cross-platform compatibility for commitment verification

---

## Decision 3: Note Format Specification

**Decision**: JSON for local storage; Noir Field elements for circuits

### Note Structure

```typescript
interface Note {
  commitment: string;      // Hex string (0x-prefixed)
  nullifier?: string;      // Hex string (for input notes only)
  value: bigint;           // Amount in wei
  token: string;           // Token address or '0x000...0' for ETH
  salt?: Uint8Array;       // Randomness for commitment
}
```

### Storage
- **Format**: JSON objects in localStorage
- **Storage Key**: `'anonlp.privacy.identity'`
- **Encryption**: Encrypted JSON for sensitive identity data

### Circuit Serialization
- Uses Noir's native Field type (251-bit scalar)
- Pedersen hash for commitment (current), transitioning to Poseidon

### Rationale
- JSON provides developer ergonomics and debuggability
- Field elements optimize ZK circuit efficiency
- Two-secret design (nullifier_secret + blinding) enhances privacy

---

## Decision 4: executeAction Interface

**Decision**: TypeScript interface matching Solidity function signature

### TypeScript Interface

```typescript
interface ExecuteActionParams {
  action: string;              // e.g., 'uniswap-v4-swap'
  inputNotes: Note[];          // Notes being spent
  outputNotes: Note[];         // Notes being created
  changeCommitment: string;    // Hex string - Poseidon hash of change note
}

interface Note {
  commitment: string;          // Hex string (0x-prefixed)
  nullifier?: string;          // Hex string (for input notes only)
  value: bigint;               // Amount in wei
  token: string;               // Token address or '0x000...0' for ETH
  salt?: Uint8Array;           // Randomness for commitment
}
```

### Solidity Signature
```solidity
function executeAction(
    bytes calldata proof,
    bytes32 root,
    bytes32 nullifierHash,
    bytes32 changeCommitment,
    bytes32 actionHash,
    uint256 investAmount,
    bytes calldata uniswapParams
) external nonReentrant
```

### Rationale
- Aligns UTXO model with Solidity contract signature
- Frontend integration matches spec requirements
- Single changeCommitment parameter (not full change note) maintains privacy

---

## Implementation Notes

### UTXO Math Flow
1. User selects 10 ETH note, enters 2 ETH investment
2. Frontend estimates gas (~0.01 ETH)
3. Calculate change: 10 - 2 - 0.01 = 7.99 ETH
4. Generate new secret for 7.99 ETH change note
5. Compute commitment using poseidon-lite
6. Call executeAction with changeCommitment

### Dependencies
- `poseidon-lite`: Commitment generation
- `viem`: Gas estimation and contract interaction
- `uuid`: Idempotency keys
