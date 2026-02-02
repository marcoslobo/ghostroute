'use client'

import { useState, useCallback } from 'react'
import { useAccount, useSignTypedData } from 'wagmi'
import { EIP712_DOMAIN, EIP712_MESSAGE, EIP712_TYPES } from '@/lib/eip712'
import { deriveMasterSecret, bytesToHex } from '@/lib/hkdf'

interface PrivacyIdentityState {
  isAuthenticated: boolean
  address: `0x${string}` | undefined
  masterSecret: Uint8Array | null
  signatureHash: string | null
  isDeriving: boolean
  error: string | null
}

export function usePrivacyIdentity() {
  const { address, chainId } = useAccount()
  const [state, setState] = useState<PrivacyIdentityState>({
    isAuthenticated: false,
    address: undefined,
    masterSecret: null,
    signatureHash: null,
    isDeriving: false,
    error: null,
  })

  const { signTypedData, isPending: isSigning, data: signature } = useSignTypedData()

  const deriveIdentity = useCallback(async () => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return
    }

    setState(prev => ({ ...prev, isDeriving: true, error: null }))

    try {
      await signTypedData({
        domain: EIP712_DOMAIN,
        types: EIP712_TYPES,
        primaryType: 'PrivacyIdentity',
        message: EIP712_MESSAGE,
      })

      if (!signature) {
        throw new Error('Signature failed or was rejected')
      }

      const signatureHash = `0x${Buffer.from(signature).toString('hex')}`
      const masterSecret = deriveMasterSecret(signatureHash)

      console.log('=== Master Secret (DEV ONLY) ===')
      console.log('Address:', address)
      console.log('Signature Hash:', signatureHash)
      console.log('Master Secret:', bytesToHex(masterSecret))
      console.log('Master Secret (bytes):', Array.from(masterSecret))
      console.log('================================')

      setState({
        isAuthenticated: true,
        address,
        masterSecret,
        signatureHash,
        isDeriving: false,
        error: null,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to derive identity'
      setState(prev => ({
        ...prev,
        isDeriving: false,
        error: errorMessage,
      }))
    }
  }, [address, signTypedData, signature])

  const clearIdentity = useCallback(() => {
    setState({
      isAuthenticated: false,
      address: undefined,
      masterSecret: null,
      signatureHash: null,
      isDeriving: false,
      error: null,
    })
  }, [])

  return {
    deriveIdentity,
    clearIdentity,
    isAuthenticated: state.isAuthenticated,
    address: state.address,
    masterSecret: state.masterSecret,
    signatureHash: state.signatureHash,
    isDeriving: state.isDeriving || isSigning,
    error: state.error,
  }
}
