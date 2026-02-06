/**
 * Investment Flow Wrapper Component
 *
 * Combines InvestmentForm and TransactionPreview in a two-step flow
 */

'use client';

import React, { useState } from 'react';
import { InvestmentForm } from './InvestmentForm';
import { TransactionPreview } from './TransactionPreview';
import { UTXOMathResult } from '@/types/utxo';

export function InvestmentFlow() {
  const [transaction, setTransaction] = useState<UTXOMathResult | null>(null);

  if (!transaction) {
    return <InvestmentForm onTransactionReady={setTransaction} />;
  }

  return (
    <div>
      <TransactionPreview
        transaction={transaction}
        actionType="uniswap-v4-swap"
        onComplete={() => setTransaction(null)}
      />
      <button
        onClick={() => setTransaction(null)}
        className="mt-4 text-sm text-gray-600 hover:text-gray-800"
      >
        ← Back to form
      </button>
    </div>
  );
}
