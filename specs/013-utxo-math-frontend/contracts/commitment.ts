import { Poseidon } from 'poseidon-lite';
import { Note, ExecuteActionParams, ETH_TOKEN_ADDRESS } from './note';

const poseidon = new Poseidon();

export function computeCommitment(note: Pick<Note, 'value' | 'token' | 'salt'>): string {
  const inputs = [
    BigInt(note.value),
    BigInt(note.token === ETH_TOKEN_ADDRESS ? 0 : parseInt(note.token, 16)),
    BigInt(note.salt ? bufferToBigInt(note.salt) : randomSalt()),
  ];
  const hash = poseidon(inputs);
  return `0x${hash.toString(16).padStart(64, '0')}`;
}

export function computeChangeCommitment(
  changeValue: bigint,
  token: string,
  salt?: Uint8Array
): string {
  return computeCommitment({
    value: changeValue,
    token,
    salt,
  });
}

export function randomSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  return salt;
}

function bufferToBigInt(buffer: Uint8Array): number {
  return parseInt(
    Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    16
  );
}
