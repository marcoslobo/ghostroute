# Feature: Webhook Consumer for ZK Indexing

## Description

Implement an off-chain Webhook Consumer in the `apps/indexer` directory to process ZK-related events from an external EVM listener.

## Requirements

### Webhook Handler
- Ingest `NewCommitment` and `NullifierSpent` payloads
- Ensure idempotency and Multi-Vault isolation (indexed by `chainId` and `vaultAddress`)

### Merkle Engine
- Update a persistent, incremental Merkle Tree (Height 20) in PostgreSQL upon every new commitment

### Data Integrity
- Implement hashing logic to match the Noir circuit (Poseidon/BN254)
- Ensure reconstructed root is identical to on-chain state

### API Layer
- Provide high-performance endpoint to serve 20-hash Merkle Path (witness) for frontend ZK-proof generation
- Design for high availability
- Handle blockchain reorgs and duplicate webhook deliveries

## Technical Stack
- Language: TypeScript/Node.js
- Database: PostgreSQL
- Hashing: Poseidon/BN254 (matching Noir circuit)
- Tree Height: 20

## Non-Requirements
- On-chain contract development (covered by 001-privacy-vault and 002-uniswap-v4-privacy-hook-adapter)
- ZK circuit development (Noir circuits are external)
