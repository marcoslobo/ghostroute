-- Migration: Add token_address column to support ERC20 deposits and withdrawals
-- Feature: 014-erc20-deposit-withdraw

-- Add token_address to processed_events
ALTER TABLE processed_events
ADD COLUMN token_address VARCHAR(42);

-- Add token_address to merkle_tree_leaves
ALTER TABLE merkle_tree_leaves
ADD COLUMN token_address VARCHAR(42);

-- Index for querying by token
CREATE INDEX IF NOT EXISTS idx_processed_events_token
    ON processed_events(token_address) WHERE token_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merkle_leaves_token
    ON merkle_tree_leaves(token_address) WHERE token_address IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN processed_events.token_address IS
'ERC20 token address for the deposit/withdrawal. NULL for ETH (address(0)) operations.';

COMMENT ON COLUMN merkle_tree_leaves.token_address IS
'ERC20 token address for this leaf. NULL for ETH (address(0)) deposits.';
