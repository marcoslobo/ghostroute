export const ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logo?: string;
}

export const TOKEN_REGISTRY: Record<number, Record<string, TokenInfo>> = {
  // Sepolia testnet
  11155111: {
    [ETH_TOKEN_ADDRESS]: {
      address: ETH_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
    },
    '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin (Sepolia)',
    },
    '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357': {
      address: '0xfF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin (Sepolia)',
    },
    ...(process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS
      ? {
          [process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS.toLowerCase()]: {
            address: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS,
            symbol: 'mUSDC',
            decimals: 6,
            name: 'Mock USDC',
          },
        }
      : {}),
    ...(process.env.NEXT_PUBLIC_MOCK_DAI_ADDRESS
      ? {
          [process.env.NEXT_PUBLIC_MOCK_DAI_ADDRESS.toLowerCase()]: {
            address: process.env.NEXT_PUBLIC_MOCK_DAI_ADDRESS,
            symbol: 'mDAI',
            decimals: 18,
            name: 'Mock DAI',
          },
        }
      : {}),
  },
  1: {
    [ETH_TOKEN_ADDRESS]: {
      address: ETH_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
    },
  },
};

export const TOKENS = {
  ETH: {
    address: ETH_TOKEN_ADDRESS,
    symbol: 'ETH',
    decimals: 18,
    name: 'Ether',
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

export function isETH(tokenAddress: string): boolean {
  return tokenAddress === ETH_TOKEN_ADDRESS || tokenAddress === '0x' + '0'.repeat(40);
}

export function getTokenInfo(tokenAddress: string, chainId: number): TokenInfo | null {
  const chainTokens = TOKEN_REGISTRY[chainId];
  if (!chainTokens) return null;
  return chainTokens[tokenAddress.toLowerCase()] ?? null;
}

export function getTokenSymbol(tokenAddress: string, chainId: number): string {
  if (isETH(tokenAddress)) return 'ETH';
  const info = getTokenInfo(tokenAddress, chainId);
  if (info) return info.symbol;
  return `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
}

export function getTokenDecimals(tokenAddress: string, chainId: number): number {
  if (isETH(tokenAddress)) return 18;
  const info = getTokenInfo(tokenAddress, chainId);
  return info?.decimals ?? 18;
}

export function getTokensByChain(chainId: number): TokenInfo[] {
  const chainTokens = TOKEN_REGISTRY[chainId];
  if (!chainTokens) return [];
  return Object.values(chainTokens);
}

export function registerToken(chainId: number, token: TokenInfo): void {
  if (!TOKEN_REGISTRY[chainId]) {
    TOKEN_REGISTRY[chainId] = {};
  }
  TOKEN_REGISTRY[chainId][token.address.toLowerCase()] = token;
}
