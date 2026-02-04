# Research: Circuit Withdrawal Flow Support

## Decision 1: Hash Function for actionHash

**Chosen**: `std::hash::pedersen_hash`

**Rationale**:
- Noir 1.0's std::hash::pedersen_hash is already used throughout the circuit for commitment and nullifier computation
- Consistent with existing architecture (compute_commitment uses pedersen_hash)
- More efficient than Poseidon in Noir 1.0 for this use case
- Deterministic and well-audited

**Alternatives considered**:
- Poseidon: Not needed here, already using Pedersen consistently
- Keccak256: Available via aztec::hash but adds complexity; Pedersen is simpler and already integrated

## Decision 2: Unified vs Separate Circuit

**Chosen**: Unified circuit with action type parameter

**Rationale**:
- Single circuit simplifies deployment and verifier management
- Same Verifier.sol works for both investment and withdrawal
- Minimal overhead - action type is just a public input
- Follows principle of minimal circuit count

**Implementation approach**:
- Add `is_withdrawal: bool` public input
- If is_withdrawal=true: verify actionHash = H(recipient, withdraw_amount)
- If is_withdrawal=false: pass through actionHash (existing investment behavior)
- Balance constraint adjusts: input_amount = withdraw_amount + change_amount OR input_amount = invest_amount + change_amount

## Decision 3: Recipient Address Format

**Chosen**: Field (packed Ethereum address)

**Rationale**:
- Noir circuits operate on Field elements
- Ethereum address (20 bytes) fits in single Field (32 bytes)
- Simple to implement with no conversion overhead
- Consistent with how other addresses are handled in circuit

**Implementation**:
- Recipient passed as Field (0x... address converted to Field)
- actionHash = pedersen_hash([recipient, amount])

## Research Findings Summary

| Question | Decision | Source |
|----------|----------|--------|
| Hash function for actionHash | pedersen_hash | Existing codebase conventions |
| Circuit architecture | Unified with action_type | Simpler deployment |
| Recipient format | Field | Noir field operations |

## Integration Points

1. **PrivacyVault Contract**: Must accept recipient address and pass to verifier
2. **Frontend**: Must compute actionHash = H(recipient, amount) client-side
3. **Verifier**: Unchanged - same public inputs format with additional is_withdrawal flag
