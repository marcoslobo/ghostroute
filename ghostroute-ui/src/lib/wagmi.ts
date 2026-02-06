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
    http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!),
    http('https://rpc.sepolia.org'), // Fallback to a public RPC if env var is not set
  ]),
  [unichainSepolia.id]: http('https://sepolia.unichain.org'),
}

export const config = createConfig({
  chains: [mainnet, sepolia, unichainSepolia], // Re-include mainnet and sepolia
  transports,
})
