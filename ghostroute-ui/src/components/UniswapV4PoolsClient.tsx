'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { NETWORK_CONFIG, type SupportedChainId } from '@/lib/uniswap-v4';
import { EnrichedPool } from '@/components/UniswapPoolsSection';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PoolInvestmentModal } from '@/components/utxo/PoolInvestmentModal';
import { PoolInvestmentResult } from '@/types/utxo/investment';
import { useNotes } from '@/hooks/utxo/useNotes';
import { isPoolCompatible } from '@/utils/utxo/poolCompatibility';

interface UniswapV4PoolsClientProps {
  pools: EnrichedPool[];
  chainId?: SupportedChainId;
}

const formatNumber = (num: string): string => {
  const value = parseFloat(num);
  if (isNaN(value)) return num;

  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

const formatTokenAmount = (amount: bigint | undefined, decimals: number): string => {
  if (!amount || amount === 0n) return '0';
  const value = Number(formatUnits(amount, decimals));
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  if (value < 0.001) {
    return value.toExponential(2);
  }
  return value.toFixed(4);
};

const truncateAddress = (address: string, chars = 6): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

const UniswapV4PoolsClient: React.FC<UniswapV4PoolsClientProps> = ({ pools, chainId = 11155111 }) => {
  const { isConnected } = useAccount();
  const { unspentNotes } = useNotes();
  const networkConfig = NETWORK_CONFIG[chainId];

  // Pool investment modal state
  const [selectedPool, setSelectedPool] = useState<EnrichedPool | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState<PoolInvestmentResult | null>(null);

  const handleOpenInvestModal = (pool: EnrichedPool) => {
    setSelectedPool(pool);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPool(null);
    // Clear success message after a delay
    if (investmentSuccess) {
      setTimeout(() => setInvestmentSuccess(null), 5000);
    }
  };

  const handleInvestmentSuccess = (result: PoolInvestmentResult) => {
    setInvestmentSuccess(result);
  };

  // Check if user has compatible notes for a pool
  const hasCompatibleNotes = (pool: EnrichedPool): boolean => {
    return unspentNotes.some((note) => isPoolCompatible(pool, note));
  };

  if (pools.length === 0) {
    return null; // Parent component handles empty state
  }

  return (
    <div className="overflow-x-auto">
      {/* Investment Success Alert */}
      {investmentSuccess && (
        <Alert variant="success" className="mb-4">
          <div className="flex flex-col">
            <span className="font-medium">Investment Successful!</span>
            <span className="text-xs">
              Transaction: {investmentSuccess.transactionHash?.slice(0, 10)}...
              {investmentSuccess.changeNote && (
                <span className="ml-2">
                  Change note: {formatUnits(investmentSuccess.changeNote.value, 18)} ETH
                </span>
              )}
            </span>
          </div>
        </Alert>
      )}

      <table className="min-w-full bg-card rounded-lg shadow-lg overflow-hidden">
        <thead className="bg-muted text-muted-foreground uppercase text-xs leading-normal">
          <tr>
            <th className="py-3 px-4 text-left">Token Pair</th>
            <th className="py-3 px-4 text-left">Fee</th>
            <th className="py-3 px-4 text-left">Reserves</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-foreground text-sm font-light">
          {pools.map((pool) => (
            <tr
              key={pool.id}
              className="border-b border-border hover:bg-muted-foreground/[0.05] transition-colors duration-200"
            >
              <td className="py-3 px-4 text-left whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {pool.token0.symbol}/{pool.token1.symbol}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {truncateAddress(pool.token0.id, 4)} / {truncateAddress(pool.token1.id, 4)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-left">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                  {(pool.fee / 10000).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-4 text-left">
                <div className="flex flex-col text-xs">
                  <span className="font-mono">
                    {formatTokenAmount(pool.token0Reserve, pool.token0.decimals)} {pool.token0.symbol}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatTokenAmount(pool.token1Reserve, pool.token1.decimals)} {pool.token1.symbol}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenInvestModal(pool)}
                    disabled={!isConnected || !hasCompatibleNotes(pool)}
                    title={!isConnected ? 'Connect wallet to invest' : !hasCompatibleNotes(pool) ? 'No compatible notes for this pool' : 'Invest using privacy notes'}
                  >
                    Invest
                    {hasCompatibleNotes(pool) && (
                      <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block" title="Compatible notes available" />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pool Investment Modal */}
      {selectedPool && (
        <PoolInvestmentModal
          pool={selectedPool}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleInvestmentSuccess}
        />
      )}
    </div>
  );
};

export default UniswapV4PoolsClient;
