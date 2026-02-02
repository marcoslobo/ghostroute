import { createHash } from 'crypto'

export function deriveMasterSecret(signatureHash: string): Uint8Array {
  const ikm = Buffer.from(signatureHash.slice(2), 'hex')
  const salt = 'AnonLP Salt:v1'
  const info = 'AnonLP Master Secret:v1'

  return hkdfSha256(ikm, salt, info, 32)
}

function hkdfSha256(
  ikm: Buffer,
  salt: string,
  info: string,
  length: number
): Uint8Array {
  const saltBuffer = Buffer.from(salt)

  const prk = hmacSha256(saltBuffer, ikm)

  const t1 = hmacSha256(prk, Buffer.concat([Buffer.from(info), Buffer.from([0x01])]))
  const t2 = hmacSha256(prk, Buffer.concat([t1, Buffer.from(info), Buffer.from([0x02])]))
  const t3 = hmacSha256(prk, Buffer.concat([t2, Buffer.from(info), Buffer.from([0x03])]))

  const output = Buffer.concat([t1, t2, t3])
  return output.slice(0, length)
}

function hmacSha256(key: Buffer, data: Buffer): Buffer {
  const blockSize = 64
  if (key.length > blockSize) {
    key = createHash('sha256').update(key).digest()
  }
  if (key.length < blockSize) {
    key = Buffer.concat([key, Buffer.alloc(blockSize - key.length)])
  }

  const oKeyPad = Buffer.from(key).map((b) => b ^ 0x5c)
  const iKeyPad = Buffer.from(key).map((b) => b ^ 0x36)

  const inner = createHash('sha256').update(iKeyPad).update(data).digest()
  return createHash('sha256').update(oKeyPad).update(inner).digest()
}

export function hashMessage(message: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hash = createHash('sha256').update(data).digest('hex')
  return `0x${hash}`
}

export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Buffer.from(bytes).toString('hex')
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2)
  }
  return Uint8Array.from(Buffer.from(hex, 'hex'))
}
