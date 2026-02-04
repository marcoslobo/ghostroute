'use client';

import React from 'react';
import { Pool } from '@/lib/graph'; // Import the Pool type

interface UniswapV4PoolsClientProps {
  pools: Pool[];
}

const formatNumber = (num: string): string => {
  const value = parseFloat(num);
  if (isNaN(value)) return num; // Return original string if not a valid number

  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2); // Keep two decimal places for smaller numbers
};

const UniswapV4PoolsClient: React.FC<UniswapV4PoolsClientProps> = ({ pools }) => {
  if (pools.length === 0) {
    return <p className="text-center">No pools found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-card rounded-lg shadow-lg overflow-hidden">
        <thead className="bg-muted text-muted-foreground uppercase text-sm leading-normal">
          <tr>
            <th className="py-3 px-6 text-left">Token Pair</th>
            <th className="py-3 px-6 text-left">Fee Tier</th>
            <th className="py-3 px-6 text-left">TVL USD</th>
            <th className="py-3 px-6 text-left">Volume USD</th>
            <th className="py-3 px-6 text-left">Pool ID</th>
            <th className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-foreground text-sm font-light">
          {pools.map((pool) => (
            <tr key={pool.id} className="border-b border-border hover:bg-muted-foreground/[0.1] transition-colors duration-200">
              <td className="py-3 px-6 text-left whitespace-nowrap">
                {pool.token0.symbol}/{pool.token1.symbol}
              </td>
              <td className="py-3 px-6 text-left">
                {pool.feeTier}
              </td>
              <td className="py-3 px-6 text-left">
                ${formatNumber(pool.totalValueLockedUSD)}
              </td>
              <td className="py-3 px-6 text-left">
                ${formatNumber(pool.volumeUSD)}
              </td>
              <td className="py-3 px-6 text-left font-mono text-xs">
                {pool.id.substring(0, 8)}...
              </td>
              <td className="py-3 px-6 text-center">
                <a
                  href={`https://info.uniswap.org/#/pools/${pool.id}`} // Example link, might need adjustment for V4
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary-foreground/[0.8] transition-colors duration-200"
                >
                  View Info
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UniswapV4PoolsClient;
