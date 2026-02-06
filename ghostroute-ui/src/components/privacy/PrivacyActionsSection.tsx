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

  const tabs: { id: TabType; label: string; color: string }[] = [
    { id: 'deposit', label: 'Deposit', color: 'blue' },
    { id: 'withdraw', label: 'Withdraw', color: 'red' },
    { id: 'invest', label: 'Invest', color: 'green' },
  ];

  const getTabClasses = (tabId: TabType) => {
    const isActive = activeTab === tabId;
    const tab = tabs.find((t) => t.id === tabId)!;

    if (isActive) {
      return `px-4 py-2 font-medium border-b-2 border-${tab.color}-600 text-${tab.color}-600`;
    }
    return 'px-4 py-2 font-medium text-gray-500 hover:text-gray-700';
  };

  return (
    <div className="glass rounded-2xl p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6">Privacy Vault Operations</h2>

      {/* Tabs */}
      <div className="border-b mb-6">
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
