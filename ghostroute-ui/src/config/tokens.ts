export const ETH_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export const TOKENS = {
  ETH: {
    address: ETH_TOKEN_ADDRESS,
    symbol: 'ETH',
    decimals: 18,
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;
