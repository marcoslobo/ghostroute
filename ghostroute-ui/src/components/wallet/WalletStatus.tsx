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
      <div className="glass rounded-lg p-4 mt-4 border border-ghost-border flex items-center justify-center">
        <p className="text-sm text-yellow-500 font-medium">Connecting wallet...</p>
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  const chainName = chainId === 11155111 ? 'Sepolia' : chainId === 1 ? 'Ethereum' : chainId === 1301 ? 'Uniswap Sepolia' : `Chain ${chainId}`;

  return (
    <div className="glass rounded-lg p-4 mt-4 border border-ghost-border shadow-card">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <span className="text-sm font-medium text-green-500 flex items-center gap-1">
          <CheckCircle size={16} /> Connected
        </span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Address</span>
        <span className="text-sm font-mono text-foreground">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Network</span>
        <span className="text-sm font-medium text-foreground">{chainName}</span>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded-md text-sm text-red-400 flex items-center gap-1">
          <XCircle size={16} /> {typeof error === 'string' ? error : (error as Error)?.message || 'An unknown error occurred.'}
        </div>
      )}
    </div>
  );
}
