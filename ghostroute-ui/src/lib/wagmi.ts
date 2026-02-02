import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { fallback } from 'viem'

const transports = {
  [mainnet.id]: fallback([
    http(`https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
    http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    http('https://cloudflare-eth.com'),
  ]),
  [sepolia.id]: fallback([
    http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`),
    http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    http('https://rpc.sepolia.org'),
  ]),
}

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports,
})
