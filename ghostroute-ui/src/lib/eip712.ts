export const EIP712_DOMAIN = {
  name: 'GhostRoute',
  version: '1',
  chainId: BigInt(11155111),
  verifyingContract: (process.env.NEXT_PUBLIC_PRIVACY_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const

export const EIP712_MESSAGE = {
  statement: 'Access and recover my privacy vault notes.',
} as const

export const EIP712_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  PrivacyIdentity: [
    { name: 'statement', type: 'string' },
  ],
} as const

export type EIP712Domain = {
  name: string
  version: string
  chainId: bigint
  verifyingContract: `0x${string}`
}
export type EIP712Message = typeof EIP712_MESSAGE
