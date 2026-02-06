import { poseidon3 } from 'poseidon-lite';
import { Note } from '@/types/utxo/note';
import { ETH_TOKEN_ADDRESS } from '@/config/tokens';

export function computeCommitment(note: Pick<Note, 'value' | 'token' | 'salt'>): string {
  const tokenValue = note.token === ETH_TOKEN_ADDRESS ? 0n : BigInt(note.token);
  const saltValue = note.salt ? bufferToBigInt(note.salt) : randomSaltValue();
  
  const hash = poseidon3([note.value, tokenValue, saltValue]);
  return `0x${hash.toString(16).padStart(64, '0')}`;
}

export function computeChangeCommitment(
  changeValue: bigint,
  token: string,
  salt?: Uint8Array
): string {
  const note: Pick<Note, 'value' | 'token' | 'salt'> = {
    value: changeValue,
    token,
    salt,
  };
  return computeCommitment(note);
}

export function randomSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  return salt;
}

function randomSaltValue(): bigint {
  const salt = randomSalt();
  return bufferToBigInt(salt);
}

function bufferToBigInt(buffer: Uint8Array): bigint {
  let result = 0n;
  for (let i = 0; i < buffer.length; i++) {
    result = result * 256n + BigInt(buffer[i]);
  }
  return result;
}
