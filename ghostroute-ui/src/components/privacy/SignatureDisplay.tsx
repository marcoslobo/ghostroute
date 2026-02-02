'use client';

import { usePrivacyIdentity } from '@/hooks/usePrivacyIdentity';
import { Card } from '@/components/ui/Card';
import { bytesToHex } from '@/lib/hkdf';

export function SignatureDisplay() {
  const { isAuthenticated, signatureHash, masterSecret } = usePrivacyIdentity();

  if (!isAuthenticated || !signatureHash || !masterSecret) {
    return null;
  }

  return (
    <Card style={{ marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Debug Information</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
        <div>
          <span style={{ color: '#6b7280' }}>Signature Hash:</span>
          <p style={{ fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all', marginTop: '0.25rem' }}>
            {signatureHash}
          </p>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Master Secret (Hex):</span>
          <p style={{ fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all', marginTop: '0.25rem' }}>
            {bytesToHex(masterSecret)}
          </p>
        </div>
        <div>
          <span style={{ color: '#6b7280' }}>Master Secret (Bytes):</span>
          <p style={{ fontFamily: 'monospace', color: '#374151', marginTop: '0.25rem' }}>
            [{Array.from(masterSecret).join(', ')}]
          </p>
        </div>
      </div>
    </Card>
  );
}
