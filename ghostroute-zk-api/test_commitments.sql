SELECT
  commitment_hash,
  leaf_index,
  block_number,
  event_id,
  status
FROM processed_events
WHERE event_type = 'NewCommitment'
  AND status = 'confirmed'
  AND commitment_hash IS NOT NULL
  AND leaf_index IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;
