'use client';

import React from 'react';
import { Pool } from '@/lib/graph';

interface UniswapV4PoolsClientProps {
  pools: Pool[];
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

const formatAddress = (addr: string): string => {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
            <th className="py-3 px-6 text-left">Pool ID</th>
            <th className="py-3 px-6 text-left">Tokens</th>
            <th className="py-3 px-6 text-left">Fee</th>
            <th className="py-3 px-6 text-left">Liquidity</th>
            <th className="py-3 px-6 text-left">Hooks</th>
            <th className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-foreground text-sm font-light">
          {pools.map((pool) => (
            <tr key={pool.id} className="border-b border-border hover:bg-muted-foreground/[0.1] transition-colors duration-200">
              <td className="py-3 px-6 text-left whitespace-nowrap">
                {formatAddress(pool.id)}
              </td>
              <td className="py-3 px-6 text-left whitespace-nowrap">
                {formatAddress(pool.currency0)} / {formatAddress(pool.currency1)}
              </td>
              <td className="py-3 px-6 text-left">
                {parseFloat(pool.fee) / 10000}%
              </td>
              <td className="py-3 px-6 text-left">
                {formatNumber(pool.liquidity)}
              </td>
              <td className="py-3 px-6 text-left">
                {pool.hooks ? formatAddress(pool.hooks) : 'Default'}
              </td>
              <td className="py-3 px-6 text-center">
                <a
                  href={`https://sepolia.etherscan.io/address/${pool.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:text-primary-foreground/[0.8] transition-colors duration-200"
                >
                  View Contract
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
