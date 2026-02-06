import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains' // Re-import mainnet and sepolia
import { fallback } from 'viem'
import { unichainSepolia } from '@/lib/uniswap-v4';

const transports = {
  [mainnet.id]: fallback([
    // Removed Infura and Alchemy entries, using only public RPC
    http('https://cloudflare-eth.com'),
  ]),
  [sepolia.id]: fallback([
    // Removed Infura and Alchemy entries, using only public RPC
    http('https://go.getblock.io/7dd9f30b3e1c4ddba5049a8a519083ef'),
  ]),
  [unichainSepolia.id]: http('https://sepolia.unichain.org'),
}

export const config = createConfig({
  chains: [mainnet, sepolia, unichainSepolia], // Re-include mainnet and sepolia
  transports,
})
