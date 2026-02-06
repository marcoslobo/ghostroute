'use client'

import { useState, useCallback, useEffect } from 'react'
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

  const { signTypedData, isPending: isSigning, data: signature, error: signError } = useSignTypedData()

  useEffect(() => {
    console.log('[PrivacyIdentity] Effect triggered:', { signature, isSigning, signError })

    if (isSigning) {
      return
    }

    if (!signature && !signError) {
      return
    }

    if (!address) {
      return
    }

    async function processSignature() {
      if (!signature) {
        console.log('[PrivacyIdentity] No signature yet, waiting...')
        return
      }

      console.log('[PrivacyIdentity] Processing signature:', signature)

      try {
        const signatureHash = signature.startsWith('0x') ? signature : `0x${signature}`
        const masterSecret = deriveMasterSecret(signatureHash)

        console.log('=== Master Secret (DEV ONLY) ===')
        console.log('Address:', address)
        console.log('Signature Hash:', signatureHash)
        console.log('Master Secret:', bytesToHex(masterSecret))
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to process signature'
        console.error('[PrivacyIdentity] Process error:', errorMessage)
        setState(prev => ({
          ...prev,
          isDeriving: false,
          error: errorMessage,
        }))
      }
    }

    processSignature()
  }, [signature, isSigning, signError, address])

  const deriveIdentity = useCallback(async () => {
    if (!address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return
    }

    if (chainId !== 11155111) {
      setState(prev => ({ ...prev, error: `Please switch to Sepolia (chainId: 11155111). Current: ${chainId}` }))
      return
    }

    setState(prev => ({ ...prev, isDeriving: true, error: null }))

    console.log('[PrivacyIdentity] Starting signature request...')

    try {
      await signTypedData({
        domain: EIP712_DOMAIN,
        types: EIP712_TYPES,
        primaryType: 'PrivacyIdentity',
        message: EIP712_MESSAGE,
      })
      console.log('[PrivacyIdentity] Sign request completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signature rejected'
      console.error('[PrivacyIdentity] Sign error:', errorMessage)
      setState(prev => ({
        ...prev,
        isDeriving: false,
        error: errorMessage,
      }))
    }
  }, [address, chainId, signTypedData])

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
