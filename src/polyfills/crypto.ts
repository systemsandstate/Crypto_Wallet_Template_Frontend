/**
 * React Native / Expo Go do not provide Node's crypto.randomBytes or Buffer.
 * ethers v6 wallet encrypt/decrypt (WalletSetup PIN step) requires both.
 */
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { randomBytes as ethersRandomBytes } from 'ethers';

let configured = false;

export function setupBufferPolyfill(): void {
  if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = Buffer as unknown as typeof globalThis.Buffer;
  }
  const g = globalThis as typeof globalThis & { global?: typeof globalThis };
  if (g.global && typeof g.global.Buffer === 'undefined') {
    g.global.Buffer = Buffer as unknown as typeof Buffer;
  }
}

export function setupCryptoPolyfills(): void {
  if (configured) return;
  configured = true;

  setupBufferPolyfill();

  ethersRandomBytes.register((length) => {
    const bytes = new Uint8Array(length);
    if (typeof globalThis.crypto?.getRandomValues !== 'function') {
      throw new Error('crypto.getRandomValues is not available');
    }
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  });
}
