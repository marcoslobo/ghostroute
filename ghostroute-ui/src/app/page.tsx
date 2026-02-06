// No 'use client' for Server Component

import Image from 'next/image';
import { WalletButton } from "@/components/wallet/WalletButton";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { NetworkSelector } from "@/components/wallet/NetworkSelector";
import { PrivacyActionsSection } from "@/components/privacy/PrivacyActionsSection";
import { BackupSection } from "@/components/privacy/BackupSection";
import { CheckCircle } from 'lucide-react';
import { UniswapPoolsSection } from '@/components/UniswapPoolsSection';

export default async function Home() { // Make Home async
  return (
    <main className="min-h-screen w-full bg-ghost-dark text-foreground grid-pattern relative overflow-x-hidden">
      {/* Hero Gradient */}
      <div className="absolute inset-x-0 top-0 h-[500px] w-full bg-gradient-hero opacity-50" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <header className="flex justify-between items-center mb-12 animate-fade-in">
          <div className="flex items-center gap-4">
            <Image src="/ghost-icon.svg" alt="GhostRoute Logo" width={40} height={40} className="animate-float" />
            <Image src="/ghostroute-text.svg" alt="GhostRoute" width={150} height={40} />
          </div>
          <div className="flex gap-4 items-center">
            <NetworkSelector />
            <WalletButton />
          </div>
        </header>

        <div className="text-center my-20 animate-slide-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gradient mb-4 glow-text">
            Your Gateway to Private DeFi
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            GhostRoute empowers you with untraceable, secure, and private transactions on the decentralized web using advanced zero-knowledge technology.
          </p>
        </div>

        <WalletStatus />

        <div className="max-w-4xl mx-auto">
          <PrivacyActionsSection />
          <BackupSection />
        </div>

        {/* Getting Started Section */}
        <div className="glass rounded-2xl p-8 my-16 border-2 border-ghost-border/50 shadow-card animate-fade-in">
          <h2 className="text-3xl font-display font-bold text-center mb-2 text-gradient">How It Works</h2>
          <p className="text-center text-muted-foreground mb-10">Two simple steps to achieve on-chain privacy.</p>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-ghost-card border border-ghost-border/50 mb-4 glow">
                <span className="font-display text-2xl text-cyan-400">1</span>
              </div>
              <h3 className="font-bold text-lg">Connect Wallet</h3>
              <p className="text-sm text-muted-foreground">Link your preferred Web3 wallet to begin.</p>
            </div>
            <div className="h-0.5 w-1/3 bg-ghost-border/30 hidden md:block"></div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-ghost-card border border-ghost-border/50 mb-4 glow">
                <span className="font-display text-2xl text-cyan-400">2</span>
              </div>
              <h3 className="font-bold text-lg">Transact Privately</h3>
              <p className="text-sm text-muted-foreground">Deposit, withdraw, and trade with zero-knowledge proofs.</p>
            </div>
          </div>
        </div>

        {/* Uniswap Pools Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 my-16 relative z-10">
          <UniswapPoolsSection />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-8 my-16">
          <div className="glass rounded-2xl p-8 border-2 border-ghost-border/50 shadow-card">
            <h3 className="text-2xl font-display font-bold mb-4 text-gradient">Core Privacy Features</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>Zero-Knowledge proofs for ultimate privacy</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>UTXO-based privacy model with commitments</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>Poseidon hash for efficient ZK circuits</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>All cryptography is handled client-side</span></li>
            </ul>
          </div>
          <div className="glass rounded-2xl p-8 border-2 border-ghost-border/50 shadow-card">
            <h3 className="text-2xl font-display font-bold mb-4 text-gradient">Robust & Resilient</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>Support for Sepolia Testnet & Ethereum Mainnet</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>Multi-transport RPC for reliable connections</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>Automatic failover for uninterrupted service</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-400" /><span>Designed for security and decentralization</span></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}