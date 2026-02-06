export const privacyConfig = {
  vaultAddress: process.env.NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS || '',
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10),
};

export function getPrivacyVaultAddress(): string {
  return privacyConfig.vaultAddress;
}

export function getChainId(): number {
  return privacyConfig.chainId;
}
