// Gas estimates in wei (not gas units!)
// Formula: gasUnits * gasPrice
// Using conservative testnet gas price (Sepolia typically 1-2 gwei)
// For mainnet, adjust this to ~30-50 gwei

const GWEI = 1_000_000_000n; // 10^9 wei
const AVG_GAS_PRICE = 2n * GWEI; // 2 gwei (testnet) - adjust for mainnet

// Gas units for each operation
const EXECUTE_ACTION_GAS_UNITS = 200_000n;
const DEPOSIT_GAS_UNITS = 130_000n;
const WITHDRAW_GAS_UNITS = 180_000n;

// Convert to wei with buffer
export const GAS_BUFFER_PERCENT = 20n;

export const EXECUTE_ACTION_GAS_BASE = (EXECUTE_ACTION_GAS_UNITS * AVG_GAS_PRICE * (100n + GAS_BUFFER_PERCENT)) / 100n;
export const DEPOSIT_GAS_BASE = (DEPOSIT_GAS_UNITS * AVG_GAS_PRICE * (100n + GAS_BUFFER_PERCENT)) / 100n;
export const WITHDRAW_GAS_BASE = (WITHDRAW_GAS_UNITS * AVG_GAS_PRICE * (100n + GAS_BUFFER_PERCENT)) / 100n;

export function calculateGasWithBuffer(baseGas: bigint): bigint {
  const buffer = (baseGas * GAS_BUFFER_PERCENT) / 100n;
  return baseGas + buffer;
}
