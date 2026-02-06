-- Migration: Add leaf_index to processed_events table
-- This allows tracking which Merkle tree position each commitment was inserted at,
-- enabling the frontend to query for leafIndex by commitment hash.

-- Add leaf_index column
ALTER TABLE processed_events
ADD COLUMN leaf_index BIGINT;

-- Create index for efficient lookups by commitment hash
-- Using partial index (WHERE clause) for better performance since we only care about confirmed NewCommitment events
CREATE INDEX idx_processed_events_commitment
ON processed_events(commitment_hash, vault_id)
WHERE event_type = 'NewCommitment' AND status = 'confirmed';

-- Add comment for documentation
COMMENT ON COLUMN processed_events.leaf_index IS
'The Merkle tree leaf index (0 to 2^20-1) where this commitment was inserted. NULL for events that pre-date this migration or for NullifierSpent events.';
