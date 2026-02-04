# Feature Specification: Circuit Withdrawal Flow Support

**Feature Branch**: `012-circuits-withdrawal-flow`  
**Created**: 2026-02-04  
**Status**: Draft  
**Input**: "Update circuits/src/main.nr to support the withdrawal flow. The circuit must verify that the actionHash provided matches H(recipient, amount). It must also constrain the values such that the balance of the input note equals the sum of the withdrawn amount and the new change note value."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Withdrawal Circuit Support (Priority: P1)

As a PrivacyVault user, I want to withdraw funds to a specified recipient address so that I can move my private funds to an external address while maintaining privacy.

**Why this priority**: Core privacy protocol functionality that enables users to exit the privacy system with their funds.

**Independent Test**: Can be tested by generating a valid ZK proof for a withdrawal transaction and verifying it produces correct public outputs.

**Acceptance Scenarios**:

1. **Given** a valid input note with amount X, **When** user requests withdrawal of amount Y to recipient R, **Then** the circuit produces valid proof where actionHash = H(R, Y) and input note balance = Y + change_amount
2. **Given** an invalid actionHash (not matching H(recipient, amount)), **When** the circuit is executed, **Then** proof generation fails
3. **Given** an input note with insufficient balance, **When** withdrawal amount + change exceeds note amount, **Then** the circuit constraint fails

---

### User Story 2 - Preserved Privacy Guarantees (Priority: P1)

As a privacy-conscious user, I want my withdrawal to not link my identity to the recipient on-chain so that my financial privacy is maintained.

**Why this priority**: Core privacy guarantee - withdrawals must not break the unlinkability property.

**Independent Test**: Can be verified by analyzing that the on-chain proof inputs contain no direct link between input note and recipient.

**Acceptance Scenarios**:

1. **Given** a valid withdrawal proof, **When** observer examines on-chain data, **Then** they cannot determine which note funded the withdrawal
2. **Given** multiple withdrawals from the same note, **When** analyzed on-chain, **Then** they appear as independent unlinkable transactions

---

### User Story 3 - Existing Investment Flow Compatibility (Priority: P2)

As a PrivacyVault user, I want to continue using the existing Uniswap investment flow so that my current use cases are not broken.

**Why this priority**: Backward compatibility is essential for user trust and protocol continuity.

**Independent Test**: Existing investment proofs still verify correctly with the updated circuit.

**Acceptance Scenarios**:

1. **Given** existing investment flow parameters, **When** generating a proof, **Then** it works exactly as before
2. **Given** an investment actionHash, **When** verifying with the updated circuit, **Then** it validates correctly

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Circuit MUST verify that actionHash equals H(recipient_address, withdraw_amount)
- **FR-002**: Circuit MUST constrain that input_note.amount = withdraw_amount + change_note.amount
- **FR-003**: Circuit MUST preserve all existing Merkle proof verification logic
- **FR-004**: Circuit MUST preserve all existing nullifier derivation logic
- **FR-005**: Circuit MUST maintain backward compatibility with investment flow (existing tests pass)
- **FR-006**: Circuit MUST NOT expose user private keys or nullifier secrets in public inputs
- **FR-007**: Circuit MUST use deterministic hashing for actionHash computation
- **FR-008**: Circuit MUST support both withdrawal and investment flows in a single circuit

### Key Entities

- **WithdrawalNote**: Represents a note being consumed for withdrawal (input to circuit)
- **ChangeNote**: Represents the change UTXO remaining after withdrawal (output from circuit)
- **Recipient**: Ethereum address receiving the withdrawal
- **ActionHash**: Public input binding recipient and amount cryptographically

### Edge Cases

- What happens when recipient address is the zero address?
- How does system handle withdrawals equal to the full note balance (zero change)?
- Privacy impact of front-running on withdrawal recipient?
- How are user funds protected if actionHash computation is incorrect?
- What are the linkability risks if Merkle proof path is leaked?

## Success Criteria *(mandurable)*

### Measurable Outcomes

- **SC-001**: Circuit compiles successfully with `nargo compile`
- **SC-002**: All existing tests pass (backward compatibility)
- **SC-003**: New withdrawal tests verify actionHash constraint
- **SC-004**: New withdrawal tests verify balance constraint
- **SC-005**: Proof generation time remains under 5 seconds for typical withdrawal
