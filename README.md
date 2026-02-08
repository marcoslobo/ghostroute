# GhostRoute

A privacy-preserving DeFi protocol built on Uniswap V4 hooks, enabling untraceable transactions using advanced zero-knowledge technology.

## 🌟 Overview

GhostRoute empowers users with complete privacy for DeFi transactions. By leveraging zero-knowledge proofs and UTXO-based privacy models, GhostRoute breaks the link between deposits and withdrawals, making your on-chain activity truly untraceable while still allowing you to participate in DeFi protocols like Uniswap V4.

### Key Features

- **🔐 Zero-Knowledge Proofs**: Complete privacy using Groth16 protocol and Noir circuits
- **💰 UTXO-Based Privacy**: Commitments and nullifiers for untraceable transactions
- **🎯 Multi-Token Support**: Native ETH and ERC20 tokens (including custom tokens like Lobo)
- **💼 Private Pool Investments**: Invest in Uniswap V4 liquidity pools without revealing your funds
- **🔒 Backup & Recovery**: Secure JSON export/import for fund recovery
- **🌐 Multi-Network**: Sepolia testnet and Ethereum Mainnet support

## 📁 Repository Structure

This monorepo contains multiple components of the GhostRoute ecosystem:

```
anonex/
├── ghostroute-ui/          # Next.js frontend application
├── ghostroute-contracts/    # Solidity smart contracts
├── ghostroute-zk-api/      # Noir circuits & API backend
├── circuits/                 # ZK circuit definitions
├── specs/                   # Feature specifications
├── AGENTS.md                 # Development guidelines
├── FUTURE_IMPROVEMENTS.md   # Comprehensive roadmap
└── README.md                 # This file
```

### Component Descriptions

- **ghostroute-ui**: Official user interface for Privacy Vault operations, pool management, and private DeFi
- **ghostroute-contracts**: Solidity contracts for Privacy Vault and Uniswap V4 hooks
- **ghostroute-zk-api**: Deno-based API for ZK proof generation and Merkle tree management
- **circuits**: Noir circuit definitions for deposit, withdraw, and investment operations

## ✅ Currently Implemented Features

### Privacy Vault Operations

- **Private Deposits**:
  - ✅ ETH deposits with zero-knowledge proofs
  - ✅ ERC20 token deposits (USDC, DAI, Lobo Token)
  - ✅ Client-side commitment generation using Poseidon hash
  - ✅ Automatic nullifier generation for privacy

- **Private Withdrawals**:
  - ✅ ZK-proof powered withdrawals
  - ✅ Proves ownership without revealing source note
  - ✅ Supports custom recipient addresses
  - ✅ Change note generation for remaining balance

- **Notes Management**:
  - ✅ View all private notes with commitments
  - ✅ Multi-token display with correct symbols
  - ✅ Decimal formatting per token (6 for USDC, 18 for ETH)
  - ✅ Note status tracking (spent/unspent)
  - ✅ Creation date tracking

### Backup & Security

- **Manual Backup System**:
  - ✅ JSON export of all notes
  - ✅ JSON import for recovery
  - ✅ File upload support
  - ✅ Paste JSON directly option
  - ✅ Critical security warnings and best practices

- **Storage**:
  - ✅ Browser localStorage for note storage
  - ✅ Per-wallet separation
  - ✅ Automatic leafIndex syncing from on-chain events

### Uniswap V4 Integration

- **Pool Operations**:
  - ✅ View active Uniswap V4 pools
  - ✅ Private liquidity investments
  - ✅ Use private notes as investment capital
  - ✅ Multi-token pool support

- **Pool Management**:
  - ✅ Hardcoded pool configuration for fast loading
  - ✅ Parse pools from Hardhat deployments
  - ✅ Fetch pools from RPC events
  - ✅ Pool caching in TypeScript config

### Wallet & Network

- **Connection**:
  - ✅ WalletConnect integration
  - ✅ MetaMask support
  - ✅ RainbowKit integration
  - ✅ Multi-wallet compatibility

- **Network**:
  - ✅ Sepolia testnet support
  - ✅ Ethereum Mainnet support
  - ✅ Multi-transport RPC (Infura + Alchemy)
  - ✅ Automatic failover

### User Interface

- **Modern Design**:
  - ✅ Dark mode throughout
  - ✅ Glassmorphism effects
  - ✅ Cyan accent color scheme
  - ✅ Responsive design (mobile-first)
  - ✅ Real-time updates

- **User Experience**:
  - ✅ Tabbed interface for Privacy Vault
  - ✅ Backup tab as primary feature
  - ✅ "Your Notes" tab for easy access
  - ✅ Transaction feedback and status
  - ✅ Error handling and alerts

## 🚧 What Needs Improvement

### Critical Issues

#### Recovery & Storage

- **❌ No Encrypted Cloud Sync**:
  - Notes stored only in browser localStorage
  - No cross-device access
  - Loss of browser = loss of funds (without manual backup)
  - **Impact**: HIGH - Users can permanently lose funds
  - **Solution**: Implement client-side encrypted cloud storage (see FUTURE_IMPROVEMENTS.md)

- **❌ No Deterministic Note Generation**:
  - Notes use random salts/nullifiers
  - Cannot regenerate notes from wallet signature
  - Manual backup is only recovery option
  - **Impact**: MEDIUM - Poor UX for recovery
  - **Solution**: BIP-44 style HD-wallet derivation

#### User Experience

- **❌ No Backup Reminders**:
  - No prompts to create backup
  - Users may forget to backup
  - Can block deposits until backup created
  - **Impact**: MEDIUM - Risk of fund loss
  - **Solution**: Auto-reminder system with backup tracking

- **❌ Limited Note Management**:
  - No note labels or tags
  - No search functionality
  - No filtering by date/amount/status
  - **Impact**: LOW - Poor UX for many notes
  - **Solution**: Add search, labels, and filters

- **❌ No Transaction History**:
  - No visual timeline of operations
  - No gas cost tracking
  - No explorer links for verification
  - **Impact**: LOW - Poor transaction visibility
  - **Solution**: Build transaction history component

#### Developer Features

- **❌ No Event Reconstruction Tools**:
  - Cannot rebuild Merkle tree from blockchain
  - No recovery from webhook failures
  - Difficult data verification
  - **Impact**: MEDIUM - Reliability concerns
  - **Solution**: Historical event scanner

- **❌ No Commitment-Based Lookup API**:
  - API requires leafIndex to fetch proofs
  - Users must store leafIndex locally
  - Cannot recover from commitment alone
  - **Impact**: MEDIUM - Recovery limitations
  - **Solution**: Add `/find-leaf` endpoint

### Security Enhancements Needed

- **❌ No Encryption Scheme Audit**: Review needed for backup/encryption implementation
- **❌ No Frontend Security Review**: Client-side code needs security audit
- **❌ No Privacy Analysis**: Formal verification of privacy guarantees
- **❌ Limited Testing**: Need E2E tests for backup/restore flow

### Operational Gaps

- **❌ No Monitoring**: No alerts on backup failures or sync issues
- **❌ No Analytics**: Cannot track user behavior patterns for improvement
- **❌ No Documentation**: User guide and disaster recovery procedures needed

## 🎬 Demo Script

A comprehensive 4-minute demonstration script is available showcasing all current features:

**Demo Flow:**
1. Wallet connection to Sepolia testnet
2. ETH private deposit (0.01 ETH)
3. ERC20 token deposit (100 Lobo Token)
4. Viewing private notes with multi-token display
5. Backup download and security warnings
6. Private withdrawal with ZK proof generation
7. Private pool investment in Uniswap V4

**Key Features Demonstrated:**
- ✅ Privacy Vault operations interface
- ✅ ETH and ERC20 private deposits
- ✅ Multi-token notes management
- ✅ Backup & security features
- ✅ ZK-powered withdrawals
- ✅ Private pool investments
- ✅ Uniswap V4 integration

*See complete script in project documentation for detailed walkthrough.*

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) version 20 or higher
- [Docker](https://www.docker.com/) (for infrastructure components)
- [Hardhat](https://hardhat.org/) (for contract deployment)
- [Wallet](https://metamask.io/) like MetaMask for testing

### Running Individual Components

#### UI (Next.js)

```bash
cd ghostroute-ui
npm install
cp .env.local.example .env.local
# Add your WalletConnect project ID and API keys
npm run dev
```

#### Smart Contracts

```bash
cd ghostroute-contracts
npm install
npx hardhat compile
npx hardhat deploy --network sepolia
```

#### Circuits

```bash
cd circuits
npm install
nargo compile
nargo test
```

#### ZK API

```bash
cd ghostroute-zk-api
export PATH="$HOME/.deno/bin:$PATH"
deno test --allow-all tests/unit/
```

### End-to-End Testing

For local testing with Anvil and Supabase:

```bash
# Terminal 1: Start Anvil
cd ghostroute-contracts
anvil

# Terminal 2: Start Supabase
cd ghostroute-zk-api/supabase
supabase start

# Terminal 3: Run E2E test
cd ghostroute-zk-api
deno run --allow-all scripts/e2e-test.ts
```

## 🛠️ Development Workflow

### Adding New Pools

1. **Deploy Pool** (in `uniswap-pool-creator` repo):
   ```bash
   npx hardhat run scripts/deployPool.js --network sepolia
   ```

2. **Parse Pools** (in `ghostroute-ui` repo):
   ```bash
   npm run parse-pools
   ```

3. **Verify** pools appear in UI

### Building for Production

```bash
cd ghostroute-ui
npm run build
npm run start
```

**Note**: The build uses webpack configuration for Noir/WebAssembly compatibility.

## 📊 Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4
- **Web3**: Wagmi 2.x + Viem 2.x
- **Wallet**: WalletConnect 2.x + RainbowKit
- **ZK Proofs**: Noir 1.0.0-beta.18 + Barretenberg 0.36.0

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Framework**: Hardhat
- **Network**: Uniswap V4 Core (BaseHook, PoolManager)
- **Cryptography**: Poseidon-lite for hashing

### Circuits
- **Language**: Noir 1.0.0-beta.18
- **Hash Functions**: Pedersen, Poseidon
- **Merkle Tree**: std::merkle from Noir std
- **Proof System**: Groth16 (Barretenberg backend)

### Backend
- **Runtime**: Deno 20.x (Edge Functions)
- **Database**: PostgreSQL 15+ (Supabase)
- **Hashing**: poseidon-lite
- **Idempotency**: UUID

## 🔐 Security & Architecture

### Privacy Model

GhostRoute uses a **UTXO-based privacy model**:

1. **Deposit**: User generates commitment = Hash(value, salt, nullifier)
2. **Store**: Commitment added to Merkle tree (visible on-chain)
3. **Withdraw**: User proves ownership of leaf using ZK proof + nullifier
4. **Privacy**: No link between deposit and withdrawal visible on-chain

### Zero-Knowledge Proofs

- **Groth16 Protocol**: Efficient, non-interactive proofs
- **Noir Circuits**: Written in Noir, compiled to WASM
- **Client-Side Generation**: All proofs created in browser
- **Verification**: Solidity verifier contract checks proofs on-chain

### Security Best Practices

1. **Always Backup**: Export your notes after every deposit
2. **Never Share Backups**: Backup files contain sensitive cryptographic material
3. **Use Testnet First**: Verify functionality on Sepolia before mainnet
4. **Verify Addresses**: Always check contract addresses before interacting
5. **Secure Storage**: Store backups in password managers or encrypted drives

## 📋 Roadmap Priority Matrix

| Feature | Impact | Effort | Priority | Status |
|---------|--------|--------|----------|---------|
| Encrypted cloud storage | High | Medium | **P0** | ⏳ Planned |
| Find leaf by commitment | Medium | Low | **P1** | ⏳ Planned |
| Backup reminders | Medium | Low | **P1** | ⏳ Planned |
| Event reconstruction | Medium | Medium | **P2** | ⏳ Planned |
| HD-wallet derivation | High | High | P2 | ⏳ Planned |
| Note labels/search | Low | Low | P3 | ⏳ Planned |

*See [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) for detailed implementation plans.*

## 🤝 Contributing

Contributions are welcome! Please:

1. Read [AGENTS.md](./AGENTS.md) for development guidelines
2. Review [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) for enhancement plans
3. Check existing issues before creating new ones
4. Submit PRs with tests and documentation
5. Ensure code follows TypeScript and Solidity conventions

### Testing Commands

```bash
# Circuit tests
cd circuits
nargo compile
nargo test

# Unit tests (ZK API)
cd ghostroute-zk-api
deno test --no-check --allow-all tests/unit/

# Lint checks
cd ghostroute-ui
npm run lint
```

## 📄 License

This project is part of the GhostRoute ecosystem. See individual component repositories for license information.

## 🔗 Resources

- **Documentation**: [AGENTS.md](./AGENTS.md) - Development guidelines
- **Roadmap**: [FUTURE_IMPROVEMENTS.md](./FUTURE_IMPROVEMENTS.md) - Enhancement plans
- **Specs**: [specs/](./specs/) - Feature specifications
- **Uniswap V4**: [Uniswap V4 Documentation](https://docs.uniswap.org/contracts/v4/overview)
- **Noir**: [Noir Language](https://noir-lang.org/)

---

*Last updated: 2026-02-07*
