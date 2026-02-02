'use client';

import { usePrivacyIdentity } from '@/hooks/usePrivacyIdentity';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function IdentitySection() {
  const { isConnected } = useWallet();
  const {
    deriveIdentity,
    isAuthenticated,
    isDeriving,
    error,
  } = usePrivacyIdentity();

  if (!isConnected) {
    return null;
  }

  return (
    <Card style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Privacy Identity</h2>
      
      {!isAuthenticated ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#4b5563' }}>
            Sign the message below to derive your Master Secret. This secret is used
            for all privacy vault operations and is never stored on-chain.
          </p>
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Message to sign:</p>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', fontFamily: 'monospace' }}>
              Access and recover my privacy vault notes.
            </p>
          </div>
          <Button
            onClick={deriveIdentity}
            disabled={isDeriving}
            variant="primary"
            style={{ alignSelf: 'flex-start' }}
          >
            {isDeriving ? 'Signing...' : 'Sign Message'}
          </Button>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#dc2626' }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '0.75rem', height: '0.75rem', background: '#22c55e', borderRadius: '9999px' }}></span>
            <span style={{ fontWeight: 500, color: '#16a34a' }}>Identity Derived</span>
          </div>
          <p style={{ color: '#4b5563' }}>
            Your Master Secret has been successfully derived. Check the browser console
            for the secret value (DEV mode only).
          </p>
        </div>
      )}
    </Card>
  );
}
