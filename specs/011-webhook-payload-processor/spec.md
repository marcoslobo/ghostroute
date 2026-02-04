# Task #11: Webhook Payload Processor (Logic)

## Overview

Implement the logic to parse and process the specific JSON payload format from the external EVM listener.

## Requirements

### Data Parsing

- Create a utility function to transform `DecodedParametersNames` and `DecodedParametersValues` arrays into a structured key-value object (Dictionary/Map)

### Event Handling

- If the event contains `commitment` and `leafIndex`, trigger the Merkle Tree leaf insertion
- If the event is `ActionExecuted`, extract the `nullifierHash` to invalidate the old note, and the `changeCommitment` with its `changeIndex` to insert the new UTXO

### Reliability

- Use `TransactionHash` and `LogIndex` as the primary key to ensure idempotent processing (avoid processing the same event twice in case of webhook retries)

### Context

- Store `ContractAddress` as `vaultAddress`
- Store `BlockchainNetworkId` as `chainId`
- Maintain Multi-Vault isolation

## Technical Notes

### Dynamic Mapping

For converting DecodedParametersNames and DecodedParametersValues:
- Input: Two arrays of equal length
- Output: Key-value object where each name maps to its corresponding value

### Merkle Update Logic

| Event Type | Commitment Type | Index Field | Action |
|------------|-----------------|-------------|--------|
| Deposit | commitment | leafIndex | Insert leaf into Merkle Tree |
| ActionExecuted | changeCommitment | changeIndex | Update tree with new UTXO |

## JSON Payload Example

```json
{
  "TransactionHash": "0x...",
  "LogIndex": 0,
  "ContractAddress": "0x...",
  "BlockchainNetworkId": 1,
  "DecodedParametersNames": ["commitment", "leafIndex", "nullifierHash"],
  "DecodedParametersValues": ["0x...", 5, "0x..."]
}
```
