'use client';

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WalletButton } from "@/components/wallet/WalletButton";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { NetworkSelector } from "@/components/wallet/NetworkSelector";
import { IdentitySection } from "@/components/privacy/IdentitySection";
import { SignatureDisplay } from "@/components/privacy/SignatureDisplay";

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', padding: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>AnonLP Privacy Vault</h1>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
              Zero-knowledge proof infrastructure for private DeFi interactions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NetworkSelector />
            <WalletButton />
          </div>
        </header>

        <WalletStatus />

        <IdentitySection />
        <SignatureDisplay />

        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          padding: '1.5rem', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          marginTop: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Getting Started</h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
            Connect your wallet to access the privacy vault features.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ 
                width: '1.5rem', 
                height: '1.5rem', 
                background: '#3b82f6', 
                color: 'white', 
                borderRadius: '9999px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>1</span>
              <span style={{ color: '#4b5563' }}>Connect your wallet</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ 
                width: '1.5rem', 
                height: '1.5rem', 
                background: '#3b82f6', 
                color: 'white', 
                borderRadius: '9999px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>2</span>
              <span style={{ color: '#4b5563' }}>Sign EIP-712 message</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ 
                width: '1.5rem', 
                height: '1.5rem', 
                background: '#3b82f6', 
                color: 'white', 
                borderRadius: '9999px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>3</span>
              <span style={{ color: '#4b5563' }}>Generate ZK proofs</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '1.5rem', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Privacy Features</h3>
            <ul style={{ color: '#4b5563', listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>• EIP-712 identity derivation</li>
              <li style={{ marginBottom: '0.5rem' }}>• HKDF-based master secret</li>
              <li style={{ marginBottom: '0.5rem' }}>• Zero-knowledge proofs</li>
              <li>• Client-side crypto</li>
            </ul>
          </div>
          <div style={{ 
            background: 'white', 
            borderRadius: '1rem', 
            padding: '1.5rem', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Networks</h3>
            <ul style={{ color: '#4b5563', listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>• Sepolia Testnet</li>
              <li style={{ marginBottom: '0.5rem' }}>• Ethereum Mainnet</li>
              <li style={{ marginBottom: '0.5rem' }}>• Multi-transport RPC</li>
              <li>• Auto-failover</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
