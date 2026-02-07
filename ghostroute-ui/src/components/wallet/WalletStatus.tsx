'use client';

import { useWallet } from '@/hooks/useWallet';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WalletStatus() {
  const { isConnected, address, chainId, isConnecting, error } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center">
        <div className="px-4 py-2 rounded-lg bg-ghost-card/50 border border-ghost-border/50">
          <p className="text-sm text-ghost-cyan font-medium animate-pulse">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  const chainName = chainId === 11155111 ? 'Sepolia' : chainId === 1 ? 'Ethereum' : `Chain ${chainId}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ghost-card/50 border border-ghost-border/50">
        <CheckCircle size={14} className="text-ghost-cyan" />
        <span className="text-ghost-cyan font-medium">Connected</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ghost-card/50 border border-ghost-border/50">
        <span className="text-muted-foreground">Address:</span>
        <span className="font-mono text-foreground">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ghost-card/50 border border-ghost-border/50">
        <span className="text-muted-foreground">Network:</span>
        <span className="font-medium text-foreground">{chainName}</span>
      </div>
      {error && (
        <div className="w-full mt-2 p-2 bg-destructive/10 border border-destructive/50 rounded-md text-sm text-destructive flex items-center gap-1">
          <XCircle size={16} /> {typeof error === 'string' ? error : (error as Error)?.message || 'An unknown error occurred.'}
        </div>
      )}
    </div>
  );
}
