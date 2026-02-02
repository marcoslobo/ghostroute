# anonex Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-30

## Active Technologies
- Solidity ^0.8.20 + Uniswap v4 Core (BaseHook, PoolManager), OpenZeppelin Contracts, EIP-1153 Transient Storage, @zk-kit/lean-imt.sol v2.0+ (for PrivacyVault integration) (002-uniswap-v4-privacy-hook-adapter)
- EIP-1153 Transient Storage (no persistent state - stateless hook) (002-uniswap-v4-privacy-hook-adapter)
- TypeScript 20.x (Node.js 20 LTS) + fastify (web framework), pg (PostgreSQL client), poseidon-lite (hashing), uuid (idempotency) (003-webhook-consumer-zk-indexing)
- PostgreSQL 15+ with connection pooling (003-webhook-consumer-zk-indexing)
- TypeScript 20.x (Deno Runtime for Edge Functions) + Supabase Edge Functions, pg (Supabase PostgreSQL), poseidon-lite (hashing), uuid (idempotency) (003-webhook-consumer-zk-indexing)
- Supabase PostgreSQL (managed, connection pooling via Supabase) (003-webhook-consumer-zk-indexing)

- Solidity ^0.8.20 + OpenZeppelin Contracts, Permit2, @zk-kit/lean-imt.sol v2.0+ (001-privacy-vault)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for Solidity ^0.8.20

## Code Style

Solidity ^0.8.20: Follow standard conventions

## Recent Changes
- 003-webhook-consumer-zk-indexing: Added mock E2E test script (scripts/mock-e2e-test.ts) for testing without infrastructure
- 003-webhook-consumer-zk-indexing: Added DeployPrivacyVault.s.sol script for local contract deployment
- 003-webhook-consumer-zk-indexing: Added Docker Compose configuration (docker-compose.e2e.yml) for full E2E testing
- 003-webhook-consumer-zk-indexing: Fixed @zk-kit/smt hash function compatibility issues
- 003-webhook-consumer-zk-indexing: Added TypeScript 20.x (Deno Runtime for Edge Functions) + Supabase Edge Functions, pg (Supabase PostgreSQL), poseidon-lite (hashing), uuid (idempotency)
- 003-webhook-consumer-zk-indexing: Added TypeScript 20.x (Node.js 20 LTS) + fastify (web framework), pg (PostgreSQL client), poseidon-lite (hashing), uuid (idempotency)
- 002-uniswap-v4-privacy-hook-adapter: Added Solidity ^0.8.20 + Uniswap v4 Core (BaseHook, PoolManager), OpenZeppelin Contracts, EIP-1153 Transient Storage, @zk-kit/lean-imt.sol v2.0+ (for PrivacyVault integration)

## Testing Commands

### Unit Tests
```bash
cd anonex-zk-api
export PATH="$HOME/.deno/bin:$PATH"
deno test --no-check --allow-all tests/unit/
```

### Mock E2E Test (without infrastructure)
```bash
cd anonex-zk-api
export PATH="$HOME/.deno/bin:$PATH"
deno run --allow-all scripts/mock-e2e-test.ts
```

### Full E2E Test (requires Anvil + Supabase local)
```bash
# Terminal 1: Start Anvil
cd anonex-contracts
anvil

# Terminal 2: Start Supabase
cd anonex-zk-api/supabase
supabase start

# Terminal 3: Run E2E test
export PATH="$HOME/.deno/bin:$PATH"
cd anonex-zk-api
deno run --allow-all scripts/e2e-test.ts
```

### Deploy PrivacyVault to Local Network
```bash
cd anonex-contracts
forge script script/DeployPrivacyVault.s.sol --fork-url http://127.0.0.1:8545 --private-key $PRIVATE_KEY --json
```


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
