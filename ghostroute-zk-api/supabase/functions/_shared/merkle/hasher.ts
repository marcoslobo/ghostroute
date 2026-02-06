export type Hash = bigint;
export type HashString = string;

export function hashToString(hash: Hash): HashString {
  return '0x' + hash.toString(16).padStart(64, '0');
}

export function stringToHash(str: HashString): Hash {
  if (!str.startsWith('0x')) {
    str = '0x' + str;
  }
  return BigInt(str);
}

function modAdd(a: Hash, b: Hash): Hash {
  const result = a + b;
  if (result >= MODULUS) {
    return result - MODULUS;
  }
  return result;
}

function modMul(a: Hash, b: Hash): Hash {
  return (a * b) % MODULUS;
}

const MODULUS = BigInt('0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47');
const PRIMITIVE_ROOT = BigInt(5);

export function hashTwo(a: Hash, b: Hash): Hash {
  return modAdd(modMul(a, PRIMITIVE_ROOT), b);
}

export function hashFour(a: Hash, b: Hash, c: Hash, d: Hash): Hash {
  const h1 = modAdd(modMul(a, PRIMITIVE_ROOT), b);
  const h2 = modAdd(modMul(c, PRIMITIVE_ROOT), d);
  return modAdd(modMul(h1, PRIMITIVE_ROOT), h2);
}

export function hashArray(inputs: Hash[]): Hash {
  if (inputs.length === 0) {
    return BigInt(0);
  }
  let result = inputs[0];
  for (let i = 1; i < inputs.length; i++) {
    result = modAdd(modMul(result, PRIMITIVE_ROOT), inputs[i]);
  }
  return result;
}

export function hashCommitment(
  value: Hash,
  salt: Hash,
  recipient: Hash,
  nonce: Hash
): Hash {
  const h1 = modAdd(modMul(value, PRIMITIVE_ROOT), salt);
  const h2 = modAdd(modMul(recipient, PRIMITIVE_ROOT), nonce);
  return modAdd(modMul(h1, PRIMITIVE_ROOT), h2);
}

export function hashNullifier(
  commitmentHash: Hash,
  secret: Hash,
  nullifierIndex: bigint
): Hash {
  const h1 = modAdd(modMul(commitmentHash, PRIMITIVE_ROOT), secret);
  return modAdd(modMul(h1, PRIMITIVE_ROOT), nullifierIndex);
}

export function createLeafHash(commitment: Hash, index: bigint): Hash {
  return modAdd(modMul(commitment, PRIMITIVE_ROOT), index);
}

export function validateHash(hash: Hash): boolean {
  const str = hash.toString(16);
  return str.length <= 64;
}

export function zeroHash(level: number): Hash {
  if (level === 0) {
    return BigInt(0);
  }
  const prev = zeroHash(level - 1);
  return modAdd(modMul(prev, PRIMITIVE_ROOT), prev);
}
