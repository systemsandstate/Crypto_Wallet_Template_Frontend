import { Platform } from 'react-native';
import { setupCryptoPolyfills, setupBufferPolyfill } from '../../polyfills/crypto';
import {
  HDNodeWallet,
  Mnemonic,
  Wallet,
  SigningKey,
  keccak256,
  sha256,
  getBytes,
  hexlify,
  encryptKeystoreJson,
} from 'ethers';
import type { KeystoreAccount } from 'ethers';

setupBufferPolyfill();
setupCryptoPolyfills();
import { HDKey } from '@scure/bip32';
import bs58 from 'bs58';
import { UsdtNetwork } from '../../constants/usdtNetworks';
import { deriveGasFreeTronAddress } from './gasfreeAddress';

/** BIP44 derivation paths aligned with Trust Wallet Core registry. */
const DERIVATION_PATHS: Record<UsdtNetwork, string> = {
  TRC20: "m/44'/195'/0'/0/0",
  ERC20: "m/44'/60'/0'/0/0",
  BEP20: "m/44'/60'/0'/0/0",
};

export interface DerivedWalletAddresses {
  TRC20: string;
  ERC20: string;
  BEP20: string;
}

const seedFromMnemonic = (mnemonic: string): Uint8Array => {
  const seed = Mnemonic.fromPhrase(mnemonic).computeSeed();
  return typeof seed === 'string' ? getBytes(seed) : seed;
};

/** TRON Base58Check uses double-SHA256 (Bitcoin-style), not keccak. */
const tronBase58CheckEncode = (addressBytes: Uint8Array): string => {
  const checksum = getBytes(sha256(sha256(hexlify(addressBytes)))).slice(0, 4);
  const full = new Uint8Array(25);
  full.set(addressBytes);
  full.set(checksum, 21);
  return bs58.encode(full);
};

const tronAddressFromPrivateKey = (privateKeyHex: string): string => {
  const uncompressed = SigningKey.computePublicKey(privateKeyHex, false);
  const pubBytes = getBytes(uncompressed).slice(1);
  const hash = getBytes(keccak256(pubBytes));
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash.slice(-20), 1);
  return tronBase58CheckEncode(addressBytes);
};

/**
 * Repair TRON addresses that were encoded with a keccak checksum by mistake.
 * Payload bytes (account id) stay the same; only the Base58Check suffix changes.
 */
export const repairTronBase58Address = (address: string): string => {
  const trimmed = address.trim();
  if (!trimmed.startsWith('T')) return trimmed;
  try {
    const decoded = bs58.decode(trimmed);
    if (decoded.length !== 25 || decoded[0] !== 0x41) return trimmed;
    const payload = decoded.slice(0, 21);
    const expected = tronBase58CheckEncode(payload);
    return expected;
  } catch {
    return trimmed;
  }
};

export const repairWalletAddresses = <T extends { network: string; address: string }>(
  wallets: T[] | null | undefined
): T[] =>
  (wallets ?? []).map((wallet) =>
    wallet.network === 'TRC20'
      ? { ...wallet, address: repairTronBase58Address(wallet.address) }
      : wallet
  );

const evmAddressFromPrivateKey = (privateKeyHex: string): string => {
  return new Wallet(privateKeyHex).address;
};

const privateKeyHexFromRoot = (root: HDKey, path: string): string => {
  const child = root.derive(path);
  if (!child.privateKey) throw new Error('Failed to derive key');
  const hex = Array.from(child.privateKey)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
};

const privateKeyHexAtPath = (mnemonic: string, path: string): string => {
  const root = HDKey.fromMasterSeed(seedFromMnemonic(mnemonic));
  return privateKeyHexFromRoot(root, path);
};

export const createMnemonic = (): string => {
  const wallet = Wallet.createRandom();
  if (!wallet.mnemonic) throw new Error('Failed to create mnemonic');
  return wallet.mnemonic.phrase;
};

export const isValidMnemonic = (phrase: string): boolean => {
  try {
    Mnemonic.fromPhrase(phrase.trim().toLowerCase());
    return true;
  } catch {
    return false;
  }
};

export const deriveAllAddresses = (mnemonic: string): DerivedWalletAddresses => {
  const root = HDKey.fromMasterSeed(seedFromMnemonic(mnemonic));
  const tronKey = privateKeyHexFromRoot(root, DERIVATION_PATHS.TRC20);
  const evmKey = privateKeyHexFromRoot(root, DERIVATION_PATHS.ERC20);

  return {
    TRC20: tronAddressFromPrivateKey(tronKey),
    ERC20: evmAddressFromPrivateKey(evmKey),
    BEP20: evmAddressFromPrivateKey(evmKey),
  };
};

export const deriveAddressForNetwork = (mnemonic: string, network: UsdtNetwork): string => {
  const all = deriveAllAddresses(mnemonic);
  return all[network];
};

export const getPrivateKeyForNetwork = (mnemonic: string, network: UsdtNetwork): string => {
  switch (network) {
    case 'TRC20':
      return privateKeyHexAtPath(mnemonic, DERIVATION_PATHS.TRC20);
    case 'ERC20':
    case 'BEP20':
      return privateKeyHexAtPath(mnemonic, DERIVATION_PATHS.ERC20);
    default:
      throw new Error('Unsupported network');
  }
};

export class WalletUnlockError extends Error {
  readonly code: 'WRONG_PIN' | 'CORRUPT_WALLET' | 'CRYPTO_UNAVAILABLE' | 'NOT_FOUND';

  constructor(message: string, code: WalletUnlockError['code']) {
    super(message);
    this.name = 'WalletUnlockError';
    this.code = code;
  }
}

/** Validate ethers keystore JSON before attempting decrypt (catches truncated SecureStore blobs). */
export const isValidEncryptedMnemonicPayload = (value: string): boolean => {
  if (!value || value.length < 80) return false;
  try {
    const parsed = JSON.parse(value) as {
      crypto?: { cipher?: string; kdf?: string };
      Crypto?: { cipher?: string; kdf?: string };
    };
    // ethers v6 writes "Crypto"; Web3 / older tooling may use "crypto".
    const crypto = parsed.crypto ?? parsed.Crypto;
    return Boolean(crypto?.cipher && crypto?.kdf);
  } catch {
    return false;
  }
};

const isWrongPinError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err || '');
  return /incorrect password|invalid password/i.test(message);
};

/** Ethers default is N=2^17; mobile Safari can take 2+ minutes at that strength. */
const WEB_SCRYPT_N = 1 << 14;
const NATIVE_SCRYPT_N = 1 << 15;

const scryptParamsForPlatform = (): { N: number; r: number; p: number } => ({
  N: Platform.OS === 'web' ? WEB_SCRYPT_N : NATIVE_SCRYPT_N,
  r: 8,
  p: 1,
});

const keystoreAccountFromHdWallet = (wallet: HDNodeWallet): KeystoreAccount => {
  const account: KeystoreAccount = { address: wallet.address, privateKey: wallet.privateKey };
  const m = wallet.mnemonic;
  if (wallet.path && m && m.wordlist.locale === 'en' && m.password === '') {
    account.mnemonic = {
      path: wallet.path,
      locale: 'en',
      entropy: m.entropy,
    };
  }
  return account;
};

export type EncryptProgressCallback = (percent: number) => void;

export const encryptMnemonic = async (
  mnemonic: string,
  pin: string,
  onProgress?: EncryptProgressCallback
): Promise<string> => {
  const wallet = HDNodeWallet.fromPhrase(mnemonic);
  return encryptKeystoreJson(keystoreAccountFromHdWallet(wallet), pin.trim(), {
    scrypt: scryptParamsForPlatform(),
    progressCallback: onProgress,
  });
};

export const decryptMnemonic = async (encryptedJson: string, pin: string): Promise<string> => {
  const normalizedPin = pin.trim();
  if (!normalizedPin) {
    throw new WalletUnlockError('Invalid wallet PIN', 'WRONG_PIN');
  }
  if (!isValidEncryptedMnemonicPayload(encryptedJson)) {
    throw new WalletUnlockError(
      'Wallet data is corrupted. Restore your recovery phrase in Wallet Setup.',
      'CORRUPT_WALLET'
    );
  }

  try {
    const wallet = await Wallet.fromEncryptedJson(encryptedJson, normalizedPin);
    if (!('mnemonic' in wallet) || !wallet.mnemonic) {
      throw new WalletUnlockError(
        'Wallet data is corrupted. Restore your recovery phrase in Wallet Setup.',
        'CORRUPT_WALLET'
      );
    }
    return wallet.mnemonic.phrase;
  } catch (err) {
    if (err instanceof WalletUnlockError) throw err;
    if (isWrongPinError(err)) {
      throw new WalletUnlockError('Invalid wallet PIN', 'WRONG_PIN');
    }
    const message = err instanceof Error ? err.message : String(err || '');
    if (/invalid json wallet|unexpected token|json/i.test(message)) {
      throw new WalletUnlockError(
        'Wallet data is corrupted. Restore your recovery phrase in Wallet Setup.',
        'CORRUPT_WALLET'
      );
    }
    if (/getrandomvalues|randombytes|crypto/i.test(message)) {
      throw new WalletUnlockError(
        'This device is missing secure crypto support. Close and reopen the app, then try again.',
        'CRYPTO_UNAVAILABLE'
      );
    }
    throw err;
  }
};

/** Try vault + legacy encrypted copies — fixes stale/corrupt primary keystore after migrations. */
export const unlockMnemonicWithPin = async (pin: string): Promise<string> => {
  const { loadEncryptedWalletCandidates, repairEncryptedWalletIfNeeded } = await import(
    './walletStorage'
  );
  const candidates = await loadEncryptedWalletCandidates();
  if (!candidates.length) {
    throw new WalletUnlockError('Wallet not found on this device', 'NOT_FOUND');
  }

  let sawWrongPin = false;
  for (const encrypted of candidates) {
    try {
      const mnemonic = await decryptMnemonic(encrypted, pin);
      await repairEncryptedWalletIfNeeded(encrypted);
      return mnemonic;
    } catch (err) {
      if (err instanceof WalletUnlockError && err.code === 'WRONG_PIN') {
        sawWrongPin = true;
        continue;
      }
      throw err;
    }
  }

  if (sawWrongPin) {
    throw new WalletUnlockError('Invalid wallet PIN', 'WRONG_PIN');
  }
  throw new WalletUnlockError(
    'Wallet data is corrupted. Restore your recovery phrase in Wallet Setup.',
    'CORRUPT_WALLET'
  );
};

export const addressesToWalletPayload = (
  addresses: DerivedWalletAddresses
): Array<{ network: UsdtNetwork; address: string }> => {
  const ownerEoa = repairTronBase58Address(addresses.TRC20);
  const trc20Address = deriveGasFreeTronAddress(ownerEoa);
  const resolved: DerivedWalletAddresses = { ...addresses, TRC20: trc20Address };
  return (Object.entries(resolved) as [UsdtNetwork, string][])
    .filter(([, address]) => Boolean(address))
    .map(([network, address]) => ({ network, address }));
};

export const walletAddressesFromMnemonic = (
  mnemonic: string
): Array<{ network: UsdtNetwork; address: string }> =>
  addressesToWalletPayload(deriveAllAddresses(mnemonic));
