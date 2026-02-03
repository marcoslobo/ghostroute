'use client';

import { usePrivacyIdentity } from '@/hooks/usePrivacyIdentity';
import { bytesToHex } from '@/lib/hkdf';

export function SignatureDisplay() {
  const { isAuthenticated, signatureHash, masterSecret } = usePrivacyIdentity();

  if (!isAuthenticated || !signatureHash || !masterSecret) {
    return null;
  }

  return (
    <div className="glass rounded-lg p-6 mt-4 border border-ghost-border/50 shadow-card">
      <h3 className="text-lg font-bold mb-4 text-foreground">Debug Information</h3>
      <div className="flex flex-col gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Signature Hash:</span>
          <p className="font-mono text-foreground/80 break-all mt-1">
            {signatureHash}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Master Secret (Hex):</span>
          <p className="font-mono text-foreground/80 break-all mt-1">
            {bytesToHex(masterSecret)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Master Secret (Bytes):</span>
          <p className="font-mono text-foreground/80 break-all mt-1">
            [{Array.from(masterSecret).join(', ')}]
          </p>
        </div>
      </div>
    </div>
  );
}
