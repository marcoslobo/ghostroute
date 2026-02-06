-- Register the new PrivacyVault deployed on 2026-02-06
-- Run this in Supabase SQL Editor

INSERT INTO vaults (chain_id, vault_address, created_at)
VALUES (
    11155111, -- Sepolia
    '0xc0145061c0c09177df754821cc64ca67e7bf27d1', -- New PrivacyVault address
    NOW()
)
ON CONFLICT (chain_id, vault_address) DO NOTHING;

-- Verify it was inserted
SELECT * FROM vaults WHERE vault_address = '0xc0145061c0c09177df754821cc64ca67e7bf27d1';
