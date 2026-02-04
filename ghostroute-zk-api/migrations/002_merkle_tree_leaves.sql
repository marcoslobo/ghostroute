-- Migration: Create merkle_tree_leaves table for UTXO tracking
-- Table: merkle_tree_leaves
-- Purpose: Track Merkle tree leaves for privacy vault operations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS merkle_tree_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    leaf_index INTEGER NOT NULL,
    commitment VARCHAR(66) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    spent_at TIMESTAMP WITH TIME ZONE,
    spent_nullifier VARCHAR(66),
    metadata JSONB,

    -- Unique constraint on commitment (no duplicate commitments)
    CONSTRAINT uk_merkle_commitment UNIQUE (commitment),

    -- Composite unique constraint on (vault, chain, leaf_index)
    CONSTRAINT uk_merkle_leaf_position UNIQUE (vault_address, chain_id, leaf_index)
);

-- Index for querying active leaves by vault and chain
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_active
    ON merkle_tree_leaves(vault_address, chain_id, is_active)
    WHERE is_active = TRUE;

-- Index for spent note lookups
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_spent_nullifier
    ON merkle_tree_leaves(spent_nullifier) WHERE spent_nullifier IS NOT NULL;

-- Index for commitment existence checks
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_commitment_lookup
    ON merkle_tree_leaves(commitment);

-- Index for leaf_index range queries (filling order)
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_leaf_index
    ON merkle_tree_leaves(vault_address, chain_id, leaf_index);

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_created_at
    ON merkle_tree_leaves(created_at DESC);

-- Foreign key reference to processed_events (optional, for data consistency)
-- Uncomment if you want strict referential integrity:
-- ALTER TABLE merkle_tree_leaves
-- ADD CONSTRAINT fk_merkle_processed_event
-- FOREIGN KEY (commitment)
-- REFERENCES processed_events(commitment);
