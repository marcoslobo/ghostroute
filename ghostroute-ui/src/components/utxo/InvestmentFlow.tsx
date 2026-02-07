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
import { Button } from '@/components/ui/Button';

export function InvestmentFlow() {
  const [transaction, setTransaction] = useState<UTXOMathResult | null>(null);

  if (!transaction) {
    return <InvestmentForm onTransactionReady={setTransaction} />;
  }

  return (
    <div className="space-y-4">
      <TransactionPreview
        transaction={transaction}
        actionType="uniswap-v4-swap"
        onComplete={() => setTransaction(null)}
      />
      <Button
        onClick={() => setTransaction(null)}
        variant="ghost"
        size="sm"
      >
        ← Back to form
      </Button>
    </div>
  );
}
