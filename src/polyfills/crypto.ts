/**
 * React Native / Expo Go do not provide Node's crypto.randomBytes.
 * ethers v6 requires it for wallet creation and keystore encryption.
 */
import 'react-native-get-random-values';
import { randomBytes as ethersRandomBytes } from 'ethers';

let configured = false;

export function setupCryptoPolyfills(): void {
  if (configured) return;
  configured = true;

  ethersRandomBytes.register((length) => {
    const bytes = new Uint8Array(length);
    if (typeof globalThis.crypto?.getRandomValues !== 'function') {
      throw new Error('crypto.getRandomValues is not available');
    }
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  });
}
