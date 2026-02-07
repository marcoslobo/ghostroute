-- Migration: Add token_address column to support ERC20 deposits and withdrawals
-- Feature: 014-erc20-deposit-withdraw

-- Add token_address to processed_events
ALTER TABLE processed_events
ADD COLUMN token_address VARCHAR(42)
CHECK (token_address IS NULL OR token_address ~* '^0x[a-fA-F0-9]{40}$');

-- Update event_type CHECK constraint to include ERC20 withdrawal type
ALTER TABLE processed_events
DROP CONSTRAINT IF EXISTS processed_events_event_type_check;

ALTER TABLE processed_events
ADD CONSTRAINT processed_events_event_type_check
CHECK (event_type IN ('NewCommitment', 'NullifierSpent', 'ERC20Withdrawal'));

-- Index for querying by token
CREATE INDEX IF NOT EXISTS idx_processed_events_token
    ON processed_events(token_address) WHERE token_address IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN processed_events.token_address IS
'ERC20 token address for the deposit/withdrawal. NULL for ETH (address(0)) operations.';
