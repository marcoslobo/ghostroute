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
      <Button onClick={handleClick} disabled={isConnecting} variant="outline" size="sm" className="text-xs px-3 py-1.5">
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isConnecting} variant="primary" size="sm" className="text-sm px-4 py-2">
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
