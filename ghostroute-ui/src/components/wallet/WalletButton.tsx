'use client';

import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function WalletButton() {
  const { isConnected, address, disconnect, isConnecting } = useWallet();
  const { openConnectModal } = useConnectModal();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      openConnectModal?.();
    }
  };

  if (isConnected && address) {
    return (
      <Button onClick={handleClick} disabled={isConnecting} variant="outline" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isConnecting} variant="primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
