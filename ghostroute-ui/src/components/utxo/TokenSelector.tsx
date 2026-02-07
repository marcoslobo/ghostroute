/**
 * Token Selector Component
 *
 * Dropdown to select ETH or an ERC20 token for deposit.
 * Supports custom token address input.
 */

'use client';

import React, { useState } from 'react';
import { ETH_TOKEN_ADDRESS, getTokensByChain, TokenInfo, isETH } from '@/config/tokens';

interface TokenSelectorProps {
  chainId: number;
  selectedToken: string;
  onSelect: (tokenAddress: string) => void;
  disabled?: boolean;
}

export function TokenSelector({ chainId, selectedToken, onSelect, disabled }: TokenSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAddress, setCustomAddress] = useState('');

  const knownTokens = getTokensByChain(chainId);

  // Always include ETH even if chain has no registry
  const tokens: TokenInfo[] = knownTokens.length > 0
    ? knownTokens
    : [{ address: ETH_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18, name: 'Ether' }];

  const handleCustomSubmit = () => {
    if (/^0x[a-fA-F0-9]{40}$/.test(customAddress)) {
      onSelect(customAddress.toLowerCase());
      setShowCustom(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Token</label>
      <div className="flex gap-2">
        <select
          value={selectedToken}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '__custom__') {
              setShowCustom(true);
            } else {
              onSelect(val);
              setShowCustom(false);
            }
          }}
          className="flex-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          {tokens.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol} {!isETH(t.address) ? `(${t.address.slice(0, 6)}...${t.address.slice(-4)})` : ''}
            </option>
          ))}
          <option value="__custom__">Custom token...</option>
        </select>
      </div>

      {showCustom && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="0x... (ERC20 token address)"
            className="flex-1 p-2 border rounded font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!/^0x[a-fA-F0-9]{40}$/.test(customAddress)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            Use
          </button>
        </div>
      )}
    </div>
  );
}
