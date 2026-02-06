'use client';

import { usePrivacyIdentity } from '@/hooks/usePrivacyIdentity';
import { useWallet } from '@/hooks/useWallet';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function IdentitySection() {
  const { isConnected } = useWallet();
  const {
    deriveIdentity,
    isAuthenticated,
    isDeriving,
    error,
  } = usePrivacyIdentity();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isConnected) {
    return null;
  }

  return (
    <div className="glass rounded-lg p-6 mt-8 border border-ghost-border shadow-card">
      <h2 className="text-2xl font-display font-bold mb-4">Privacy Identity</h2>
      
      {!isAuthenticated ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Sign the message below to derive your Master Secret. This secret is used
            for all privacy vault operations and is never stored on-chain.
          </p>
          <div className="p-4 bg-ghost-dark rounded-lg border border-ghost-border">
            <p className="text-sm font-medium text-foreground mb-2">Message to sign:</p>
            <p className="text-sm text-muted-foreground font-mono">
              Access and recover my privacy vault notes.
            </p>
          </div>
          <button
            onClick={deriveIdentity}
            disabled={isDeriving}
            className="self-start px-4 py-2 bg-ghost-cyan/20 text-ghost-cyan-glow font-semibold rounded-lg border border-ghost-cyan/50 hover:bg-ghost-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeriving ? 'Signing...' : 'Sign Message'}
          </button>
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-md text-sm text-red-400 flex items-center gap-2">
              <XCircle size={16} /> {typeof error === 'string' ? error : (error as Error)?.message || 'An error occurred during identity derivation.'}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-green-500 font-medium text-base">
            <CheckCircle size={20} />
            <span>Identity Derived Successfully</span>
          </div>
          <p className="text-muted-foreground text-base">
            Your Master Secret is now active. You can proceed with private operations.
          </p>
        </div>
      )}
    </div>
  );
}
