'use client';

import { usePrivacyIdentity } from '@/hooks/usePrivacyIdentity';
import { useWallet } from '@/hooks/useWallet';
import { CheckCircle, XCircle, Loader2, Copy, CopyCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export function IdentitySection() {
  const { isConnected, chainId } = useWallet();
  const {
    deriveIdentity,
    isAuthenticated,
    isDeriving,
    error,
    masterSecret,
    signatureHash,
  } = usePrivacyIdentity();
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const copyToClipboard = () => {
    if (masterSecret) {
      const hex = Buffer.from(masterSecret).toString('hex');
      navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          {chainId !== 11155111 && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-md text-sm text-yellow-400">
              Warning: You are on chain {chainId}. Please switch to Sepolia (11155111).
            </div>
          )}
          <button
            onClick={deriveIdentity}
            disabled={isDeriving || chainId !== 11155111}
            className="self-start px-6 py-3 bg-ghost-cyan/20 text-ghost-cyan-glow font-semibold rounded-lg border border-ghost-cyan/50 hover:bg-ghost-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeriving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              'Sign Message'
            )}
          </button>
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-md text-sm text-red-400 flex items-center gap-2">
              <XCircle size={16} />
              <span>{error || 'An error occurred during identity derivation.'}</span>
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
          
          {signatureHash && (
            <div className="p-4 bg-ghost-dark rounded-lg border border-ghost-border">
              <p className="text-sm font-medium text-foreground mb-2">Signature Hash:</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {signatureHash}
              </p>
            </div>
          )}

          <button
            onClick={copyToClipboard}
            className="self-start px-4 py-2 bg-ghost-dark/50 text-muted-foreground font-medium rounded-lg border border-ghost-border hover:bg-ghost-dark transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <CopyCheck className="w-4 h-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Master Secret
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
