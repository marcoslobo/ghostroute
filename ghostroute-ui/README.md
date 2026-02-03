# GhostRoute UI

This is the official user interface for the GhostRoute Privacy Vault, a gateway to private, untraceable transactions on the decentralized web using advanced zero-knowledge technology.

## ✨ Features

-   **Cryptographic Identity:** Leverages EIP-712 for secure and private identity derivation.
-   **Zero-Knowledge Proofs:** Employs ZK proofs for ultimate on-chain privacy.
-   **Client-Side Cryptography:** All sensitive operations are handled locally in your browser, ensuring your keys never leave your device.
-   **Multi-Network Support:** Compatible with Ethereum Mainnet and Sepolia Testnet.
-   **Resilient Connections:** Uses a multi-transport RPC system for reliable and stable connections.

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