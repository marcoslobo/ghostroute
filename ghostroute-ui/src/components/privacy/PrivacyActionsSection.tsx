/**
 * Privacy Actions Section Component
 *
 * Main container for deposit/withdraw/invest operations with tabbed interface
 */

'use client';

import React, { useState } from 'react';
import { useNotes } from '@/hooks/utxo';
import { DepositForm } from '@/components/utxo/DepositForm';
import { WithdrawForm } from '@/components/utxo/WithdrawForm';
import { InvestmentFlow } from '@/components/utxo/InvestmentFlow';
import { NotesList } from '@/components/utxo/NotesList';

type TabType = 'deposit' | 'withdraw' | 'invest';

export function PrivacyActionsSection() {
  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const { notes, totalBalance, refreshNotes } = useNotes();

  const tabs: { id: TabType; label: string }[] = [
    { id: 'deposit', label: 'Deposit' },
    { id: 'withdraw', label: 'Withdraw' },
    { id: 'invest', label: 'Invest' },
  ];

  const getTabClasses = (tabId: TabType) => {
    const isActive = activeTab === tabId;

    if (isActive) {
      return 'px-4 py-2 font-medium border-b-2 border-ghost-cyan text-ghost-cyan';
    }
    return 'px-4 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors';
  };

  return (
    <div className="glass rounded-2xl p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6">Privacy Vault Operations</h2>

      {/* Tabs */}
      <div className="border-b border-ghost-border mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={getTabClasses(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'deposit' && <DepositForm onComplete={refreshNotes} />}
        {activeTab === 'withdraw' && <WithdrawForm onComplete={refreshNotes} />}
        {activeTab === 'invest' && <InvestmentFlow />}
      </div>

      {/* Notes List */}
      <NotesList notes={notes} totalBalance={totalBalance} />
    </div>
  );
}
