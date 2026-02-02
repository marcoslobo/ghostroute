-- Initial schema for ZK Indexer Webhook Consumer
-- Creates tables for vaults, merkle nodes, and processed events

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vault configuration table
CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INTEGER NOT NULL,
    vault_address VARCHAR(42) NOT NULL CHECK (vault_address ~* '^0x[a-fA-F0-9]{40}$'),
    current_root VARCHAR(66),
    latest_block_number BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_id, vault_address)
);

-- Merkle tree nodes table (sparse storage)
CREATE TABLE IF NOT EXISTS merkle_nodes (
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 20),
    index BIGINT NOT NULL,
    hash VARCHAR(66) NOT NULL CHECK (hash ~* '^0x[a-fA-F0-9]{64}$'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (vault_id, level, index)
);

-- Processed events table for idempotency
CREATE TABLE IF NOT EXISTS processed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('NewCommitment', 'NullifierSpent')),
    event_id VARCHAR(100) NOT NULL,
    block_number BIGINT NOT NULL,
    commitment_hash VARCHAR(66) CHECK (commitment_hash IS NULL OR commitment_hash ~* '^0x[a-fA-F0-9]{64}$'),
    nullifier_hash VARCHAR(66) CHECK (nullifier_hash IS NULL OR nullifier_hash ~* '^0x[a-fA-F0-9]{64}$'),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'reverted')),
    UNIQUE(vault_id, event_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_merkle_nodes_vault_level ON merkle_nodes(vault_id, level);
CREATE INDEX IF NOT EXISTS idx_processed_events_vault_block ON processed_events(vault_id, block_number);
CREATE INDEX IF NOT EXISTS idx_vaults_chain_address ON vaults(chain_id, vault_address);
CREATE INDEX IF NOT EXISTS idx_processed_events_status ON processed_events(status);
CREATE INDEX IF NOT EXISTS idx_vaults_current_root ON vaults(current_root);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_vault_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vault_timestamp ON vaults;
CREATE TRIGGER update_vault_timestamp
    BEFORE UPDATE ON vaults
    FOR EACH ROW
    EXECUTE FUNCTION update_vault_timestamp();

-- Function to get or create vault by chain_id and vault_address
CREATE OR REPLACE FUNCTION get_or_create_vault(
    p_chain_id INTEGER,
    p_vault_address VARCHAR(42)
) RETURNS UUID AS $$
DECLARE
    v_vault_id UUID;
BEGIN
    SELECT id INTO v_vault_id
    FROM vaults
    WHERE chain_id = p_chain_id AND vault_address = p_vault_address;

    IF NOT FOUND THEN
        INSERT INTO vaults (chain_id, vault_address)
        VALUES (p_chain_id, p_vault_address)
        RETURNING id INTO v_vault_id;
    END IF;

    RETURN v_vault_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if event was already processed (for idempotency)
CREATE OR REPLACE FUNCTION is_event_processed(
    p_vault_id UUID,
    p_event_id VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM processed_events
    WHERE vault_id = p_vault_id AND event_id = p_event_id;

    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record processed event
CREATE OR REPLACE FUNCTION record_processed_event(
    p_vault_id UUID,
    p_event_type VARCHAR(50),
    p_event_id VARCHAR(100),
    p_block_number BIGINT,
    p_commitment_hash VARCHAR(66),
    p_nullifier_hash VARCHAR(66)
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO processed_events (
        vault_id, event_type, event_id, block_number,
        commitment_hash, nullifier_hash, status
    ) VALUES (
        p_vault_id, p_event_type, p_event_id, p_block_number,
        p_commitment_hash, p_nullifier_hash, 'confirmed'
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark events as reverted (for reorg handling)
CREATE OR REPLACE FUNCTION revert_events_after_block(
    p_vault_id UUID,
    p_block_number BIGINT
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE processed_events
    SET status = 'reverted'
    WHERE vault_id = p_vault_id
      AND block_number >= p_block_number
      AND status = 'confirmed';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
