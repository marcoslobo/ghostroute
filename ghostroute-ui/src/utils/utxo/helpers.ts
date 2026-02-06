/**
 * UTXO Utility Helper Functions
 */

/**
 * Convert Uint8Array to hex string with 0x prefix
 */
export function bufferToHex(buffer: Uint8Array): `0x${string}` {
  return `0x${Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const matches = cleaned.match(/.{1,2}/g);
  if (!matches) return new Uint8Array();
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Format wei to ETH with 6 decimal places
 */
export function formatETH(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(6);
}

/**
 * Format wei to ETH with custom decimal places
 */
export function formatETHCustom(wei: bigint, decimals: number): string {
  return (Number(wei) / 1e18).toFixed(decimals);
}

/**
 * Truncate hex string for display
 */
export function truncateHex(hex: string, startChars = 6, endChars = 4): string {
  if (hex.length <= startChars + endChars) return hex;
  return `${hex.slice(0, startChars)}...${hex.slice(-endChars)}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format transaction hash for Etherscan link
 */
export function getEtherscanLink(txHash: string, chainId: number): string {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
