'use client';

import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';

const SUPPORTED_CHAINS = [
  { id: 11155111, name: 'Sepolia' },
  { id: 1, name: 'Ethereum' },
] as const;

export function NetworkSelector() {
  const { chainId, switchChain, isConnected } = useWallet();

  if (!isConnected) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {SUPPORTED_CHAINS.map((chain) => (
        <Button
          key={chain.id}
          onClick={() => switchChain(chain.id)}
          variant={chainId === chain.id ? 'primary' : 'outline'}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
        >
          {chain.name}
        </Button>
      ))}
    </div>
  );
}
