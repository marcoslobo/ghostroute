'use client';

import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

const SUPPORTED_CHAINS = [
  { id: 11155111, name: 'Sepolia' },
  { id: 1, name: 'Ethereum' },
] as const;

export function NetworkSelector() {
  const { chainId, switchChain, isConnected } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isConnected) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {SUPPORTED_CHAINS.map((chain) => (
        <Button
          key={chain.id}
          onClick={() => switchChain(chain.id)}
          variant={chainId === chain.id ? 'primary' : 'outline'}
          size="sm"
        >
          {chain.name}
        </Button>
      ))}
    </div>
  );
}
