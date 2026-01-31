# Feature Specification: PrivacyVault Implementation

**Feature Branch**: `001-privacy-vault`  
**Created**: 2026-01-30  
**Status**: Draft  
**Input**: User description: "Help me implement the first task of the AnonLP project based on the Constitution. We need to create PrivacyVault.sol with an incremental Merkle Tree (height 20). Use Foundry for tests and ensure it supports both ETH and ERC20 via Permit2. Focus on gas efficiency for the insertLeaf function."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Privacy Deposit (Priority: P1)

User wants to deposit funds (ETH or ERC20) into the PrivacyVault while maintaining complete anonymity of their deposit source and future liquidity positions.

**Why this priority**: This is the foundational privacy mechanism that enables all other DeFi interactions without compromising user financial identity.

**Independent Test**: Can be fully tested by depositing funds and verifying that the Merkle Tree updates correctly while no on-chain link exists between the deposit transaction and the resulting leaf.

**Acceptance Scenarios**:

1. **Given** user has ETH/ERC20 tokens, **When** user calls deposit with valid Permit2 signature, **Then** funds are locked in vault and new leaf is added to Merkle Tree
2. **Given** invalid Permit2 signature, **When** user calls deposit, **Then** transaction reverts with specific error
3. **Given** Merkle Tree at capacity, **When** user calls deposit, **Then** transaction reverts with tree full error

---

### User Story 2 - Merkle Tree Management (Priority: P1)

System must maintain an efficient incremental Merkle Tree of height 20 (supporting ~1M leaves) with optimal gas costs for leaf insertion.

**Why this priority**: Merkle Tree efficiency is critical for gas costs and scalability of the privacy system.

**Independent Test**: Can be fully tested by inserting multiple leaves and verifying tree state transitions and root calculations.

**Acceptance Scenarios**:

1. **Given** empty Merkle Tree, **When** first leaf is inserted, **Then** tree root is calculated correctly and gas cost is measured
2. **Given** partially filled tree, **When** leaf is inserted, **Then** root updates efficiently and tree state remains consistent
3. **Given** tree with existing leaves, **When** multiple leaves are inserted in sequence, **Then** all intermediate states are verifiable

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support ETH deposits via Permit2 for maximum privacy
- **FR-002**: System MUST support ERC20 deposits via Permit2 for token diversity  
- **FR-003**: System MUST implement incremental Merkle Tree with height exactly 20
- **FR-004**: insertLeaf function MUST be gas optimized (target < 100k gas)
- **FR-005**: System MUST maintain zero-knowledge privacy by design
- **FR-006**: System MUST ensure atomic execution of deposit operations
- **FR-007**: System MUST prevent on-chain linkability between deposits and leaves

### Key Entities *(include if feature involves data)*

- **PrivacyVault**: Main contract managing Merkle Tree and deposits
- **MerkleTree**: Incremental tree implementation with height 20
- **Leaf**: Represents a user deposit with nullifier and commitment
- **Deposit**: ETH or ERC20 tokens locked in the vault

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: insertLeaf function gas cost under 100,000 gas units
- **SC-002**: Merkle Tree supports up to 1,048,576 leaves (2^20) 
- **SC-003**: 100% test coverage for all Merkle Tree state transitions
- **SC-004**: PrivacyVault passes Foundry security audit tests
- **SC-005**: Zero linkability between deposit transactions and leaf positions