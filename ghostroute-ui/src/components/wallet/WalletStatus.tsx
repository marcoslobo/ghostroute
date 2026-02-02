'use client';

import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/Card';

export function WalletStatus() {
  const { isConnected, address, chainId, isConnecting, error } = useWallet();

  if (isConnecting) {
    return (
      <Card padding="sm" style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#d97706' }}>Connecting wallet...</p>
      </Card>
    );
  }

  if (!isConnected) {
    return null;
  }

  const chainName = chainId === 11155111 ? 'Sepolia' : chainId === 1 ? 'Ethereum' : `Chain ${chainId}`;

  return (
    <Card padding="sm" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Status</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#16a34a' }}>Connected</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Address</span>
        <span style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Network</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{chainName}</span>
      </div>
      {error && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#dc2626' }}>
          {error}
        </div>
      )}
    </Card>
  );
}
