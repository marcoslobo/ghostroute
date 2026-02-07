# GhostRoute UI

This is the official user interface for the GhostRoute Privacy Vault, a gateway to private, untraceable transactions on the decentralized web using advanced zero-knowledge technology.

## ✨ Features

### 🔐 Privacy & Security
-   **Zero-Knowledge Proofs:** Employs ZK proofs for ultimate on-chain privacy using Groth16 protocol
-   **UTXO-Based Privacy Model:** Uses commitments and nullifiers for untraceable transactions
-   **Poseidon Hash:** Optimized hash function for efficient ZK circuits
-   **Client-Side Cryptography:** All sensitive operations handled locally in your browser
-   **EIP-712 Identity Derivation:** Secure and private identity management

### 💰 DeFi Operations
-   **Privacy Vault:** Deposit, withdraw, and manage private funds with zero-knowledge proofs
-   **Uniswap V4 Integration:** View and interact with live Uniswap V4 pools
-   **Liquidity Management:** Add and remove liquidity from pools privately
-   **Backup & Recovery:** Export/import your notes securely to prevent fund loss

### 🌐 Network Support
-   **Ethereum Mainnet:** Full production environment support
-   **Sepolia Testnet:** Development and testing environment
-   **Multi-Transport RPC:** Automatic failover for reliable connections (Infura + Alchemy)

### 🎨 Modern UI
-   **Dark Mode Throughout:** Consistent dark theme with cyan accents
-   **Glass Morphism:** Beautiful glassmorphic effects on all major components
-   **Responsive Design:** Mobile-first approach with seamless desktop experience
-   **Real-time Updates:** Live wallet status, network indicators, and transaction feedback

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (version 20.9.0 or higher)
-   [npm](https://www.npmjs.com/)

### 2. Installation

```bash
# Navigate to the UI directory
cd ghostroute-ui

# Install dependencies
npm install
```

### 3. Environment Variables

Before running the application, you need to set up your environment variables.

1.  Create a copy of the example environment file:
    ```bash
    cp .env.local.example .env.local
    ```
2.  Open the newly created `.env.local` file and add the required values. At a minimum, you must provide a `projectId` from WalletConnect.

    -   `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Get your free ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).
    -   `NEXT_PUBLIC_INFURA_API_KEY` / `NEXT_PUBLIC_ALCHEMY_API_KEY`: Required for reliable RPC connections to Mainnet and Sepolia.

### 4. Run the Development Server

Once your environment variables are set, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🛠️ Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase.

## 🏗️ Tech Stack

-   **Framework:** Next.js 14+ (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS with custom design tokens
-   **Web3:** Wagmi + Viem for Ethereum interactions
-   **Wallet:** WalletConnect integration
-   **Zero-Knowledge:** SnarkJS for ZK proof generation
-   **Storage:** Browser localStorage for encrypted notes

## 📂 Project Structure

```
ghostroute-ui/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx      # Main landing page
│   │   └── v4-pools/     # Uniswap V4 pools page
│   ├── components/
│   │   ├── ui/           # Base UI components (Button, Card, Input, Alert)
│   │   ├── wallet/       # Wallet connection components
│   │   ├── privacy/      # Privacy vault operations
│   │   └── utxo/         # UTXO management (Deposit, Withdraw, Invest)
│   ├── hooks/            # React hooks (useWallet, useNotes, useUTXOMath)
│   ├── lib/              # Utilities and configs
│   │   └── uniswap-v4/   # Uniswap V4 integration
│   ├── services/         # Storage and external services
│   └── types/            # TypeScript type definitions
├── public/               # Static assets (logos, icons)
└── tailwind.config.ts    # Tailwind configuration with custom theme
```

## 🎨 Design System

The UI follows a consistent design system with:

-   **Colors:**
    -   Primary: `ghost-cyan` (hsl(187 85% 53%))
    -   Background: `ghost-dark` (hsl(222 47% 6%))
    -   Card: `ghost-card` (hsl(222 47% 10%))
    -   Border: `ghost-border` (hsl(222 47% 18%))

-   **Components:**
    -   **Button:** 5 variants (primary, secondary, outline, ghost, destructive)
    -   **Card:** 3 variants (default, glass, glow)
    -   **Input:** Dark mode compatible with cyan focus rings
    -   **Alert:** 4 variants (success, error, warning, info)

-   **Typography:**
    -   Headings: Space Grotesk (font-display)
    -   Body: Inter (font-sans)

## 🔒 Security Best Practices

1.  **Backup Your Notes:** Always export and securely store your backup after depositing funds
2.  **Never Share Backups:** Your backup file contains sensitive cryptographic material
3.  **Use Multiple Storage Locations:** Password managers, encrypted USB drives, or paper backups
4.  **Verify Contracts:** Always verify the contract addresses you're interacting with
5.  **Test First:** Use Sepolia testnet before deploying to mainnet

## 🐛 Troubleshooting

### Wallet Connection Issues
-   Ensure you have a compatible wallet (MetaMask, WalletConnect, etc.)
-   Check that you're on a supported network (Sepolia or Ethereum Mainnet)
-   Clear browser cache and try reconnecting

### Transaction Failures
-   Verify you have sufficient ETH for gas fees
-   Check that the network is not congested
-   Ensure your notes have not been spent already

### Pool Loading Issues
-   Verify RPC endpoints are responding (check API keys in `.env.local`)
-   Try switching networks to refresh pool data
-   Check browser console for detailed error messages

## 📝 License

This project is part of the GhostRoute ecosystem. See the main repository for license information.

## 🤝 Contributing

Contributions are welcome! Please ensure all UI changes maintain the established design system and pass linting checks before submitting PRs.