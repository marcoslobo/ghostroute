'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { useState, type ReactNode } from 'react';
import { injected, walletConnect } from 'wagmi/connectors';

interface ProvidersProps {
  children: ReactNode;
}

// WalletConnect Project ID (get from https://cloud.reown.com)
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    '⚠️ NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not set. Get one at https://cloud.reown.com\n' +
    'WalletConnect features may not work properly.'
  );
}

// Configure with public RPCs that support CORS
const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: projectId || 'placeholder',
    }),
  ],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [sepolia.id]: http('https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef'),
  },
  ssr: false,
});

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
