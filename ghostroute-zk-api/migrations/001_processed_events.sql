-- Migration: Create processed_events table for idempotency tracking
-- Table: processed_events
-- Purpose: Track processed webhook events to ensure idempotent processing

CREATE TABLE IF NOT EXISTS processed_events (
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    vault_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    commitment VARCHAR(66),
    leaf_index INTEGER,
    nullifier_hash VARCHAR(66),
    change_commitment VARCHAR(66),
    change_index INTEGER,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_payload JSONB,
    PRIMARY KEY (transaction_hash, log_index)
);

-- Index for querying by vault and chain (common access pattern)
CREATE INDEX IF NOT EXISTS idx_processed_events_vault_chain
    ON processed_events(vault_address, chain_id);

-- Index for nullifier lookups (when invalidating notes)
CREATE INDEX IF NOT EXISTS idx_processed_events_nullifier
    ON processed_events(nullifier_hash) WHERE nullifier_hash IS NOT NULL;

-- Index for commitment lookups
CREATE INDEX IF NOT EXISTS idx_processed_events_commitment
    ON processed_events(commitment) WHERE commitment IS NOT NULL;

-- Index for processing timestamp queries
CREATE INDEX IF NOT EXISTS idx_processed_events_processed_at
    ON processed_events(processed_at DESC);
