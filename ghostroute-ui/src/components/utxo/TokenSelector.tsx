/**
 * Token Selector Component
 *
 * Dropdown to select ETH or an ERC20 token for deposit.
 * Supports custom token address input.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ETH_TOKEN_ADDRESS, getTokensByChain, TokenInfo, isETH } from '@/config/tokens';

interface TokenSelectorProps {
  chainId: number;
  selectedToken: string;
  onSelect: (tokenAddress: string) => void;
  disabled?: boolean;
}

export function TokenSelector({ chainId, selectedToken, onSelect, disabled }: TokenSelectorProps) {
  const [customAddress, setCustomAddress] = useState('');
  const [mode, setMode] = useState<'select' | 'custom'>('select');

  const knownTokens = getTokensByChain(chainId);

  const tokens: TokenInfo[] = knownTokens.length > 0
    ? knownTokens
    : [{ address: ETH_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18, name: 'Ether' }];

  useEffect(() => {
    console.log('[TokenSelector] selectedToken changed to:', selectedToken);
    if (selectedToken && !tokens.find(t => t.address.toLowerCase() === selectedToken.toLowerCase())) {
      setMode('custom');
      setCustomAddress(selectedToken);
    }
  }, [selectedToken, tokens]);

  const handleSelect = (tokenAddr: string) => {
    console.log('[TokenSelector] handleSelect:', tokenAddr);
    onSelect(tokenAddr);
    setMode('select');
    setCustomAddress('');
  };

  const handleCustomSubmit = () => {
    console.log('[TokenSelector] handleCustomSubmit:', customAddress);
    if (/^0x[a-fA-F0-9]{40}$/.test(customAddress)) {
      handleSelect(customAddress.toLowerCase());
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Token</label>
      
      {mode === 'select' ? (
        <div className="flex gap-2">
          <select
            value={selectedToken}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setMode('custom');
              } else {
                handleSelect(e.target.value);
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
      ) : (
        <div className="flex gap-2">
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
          <button
            type="button"
            onClick={() => {
              setMode('select');
              setCustomAddress('');
              handleSelect(ETH_TOKEN_ADDRESS);
            }}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
