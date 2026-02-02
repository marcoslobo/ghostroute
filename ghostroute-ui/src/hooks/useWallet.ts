'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useState, useCallback } from 'react'

interface WalletState {
  isConnected: boolean
  address: `0x${string}` | undefined
  chainId: number | undefined
  isConnecting: boolean
  error: string | null
}

export function useWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [error, setError] = useState<string | null>(null)

  const connectWallet = useCallback(async (connectorId?: string) => {
    setError(null)
    try {
      const connector = connectorId
        ? connectors.find(c => c.id === connectorId)
        : connectors[0]
      if (connector) {
        connect({ connector })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }, [connect, connectors])

  const disconnectWallet = useCallback(() => {
    setError(null)
    disconnect()
  }, [disconnect])

  const switchToChain = useCallback((targetChainId: number) => {
    setError(null)
    try {
      switchChain({ chainId: targetChainId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch chain')
    }
  }, [switchChain])

  return {
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchChain: switchToChain,
    isConnected,
    isConnecting,
    address,
    chainId,
    error,
    connectors,
  }
}
