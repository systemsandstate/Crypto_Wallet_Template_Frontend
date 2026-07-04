import { setupCryptoPolyfills } from '../../polyfills/crypto';
import { HDNodeWallet, Mnemonic, Wallet, SigningKey, keccak256, getBytes } from 'ethers';

setupCryptoPolyfills();
import { HDKey } from '@scure/bip32';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { UsdtNetwork } from '../../constants/usdtNetworks';

/** BIP44 derivation paths aligned with Trust Wallet Core registry. */
const DERIVATION_PATHS: Record<UsdtNetwork, string> = {
  TRC20: "m/44'/195'/0'/0/0",
  ERC20: "m/44'/60'/0'/0/0",
  BEP20: "m/44'/60'/0'/0/0",
  POLYGON: "m/44'/60'/0'/0/0",
  SOL: "m/44'/501'/0'/0'",
};

export interface DerivedWalletAddresses {
  TRC20: string;
  ERC20: string;
  BEP20: string;
  POLYGON: string;
  SOL: string;
}

const seedFromMnemonic = (mnemonic: string): Uint8Array => {
  const seed = Mnemonic.fromPhrase(mnemonic).computeSeed();
  return typeof seed === 'string' ? getBytes(seed) : seed;
};

const tronAddressFromPrivateKey = (privateKeyHex: string): string => {
  const uncompressed = SigningKey.computePublicKey(privateKeyHex, false);
  const pubBytes = getBytes(uncompressed).slice(1);
  const hash = getBytes(keccak256(pubBytes));
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash.slice(-20), 1);
  const checksum = getBytes(keccak256(keccak256(addressBytes))).slice(0, 4);
  const full = new Uint8Array(25);
  full.set(addressBytes);
  full.set(checksum, 21);
  return bs58.encode(full);
};

const evmAddressFromPrivateKey = (privateKeyHex: string): string => {
  return new Wallet(privateKeyHex).address;
};

const solanaAddressFromMnemonic = (mnemonic: string): string => {
  try {
    const root = HDKey.fromMasterSeed(seedFromMnemonic(mnemonic));
    const child = root.derive(DERIVATION_PATHS.SOL);
    if (!child.privateKey) return '';
    const keypair = Keypair.fromSeed(child.privateKey.slice(0, 32));
    return keypair.publicKey.toBase58();
  } catch {
    return '';
  }
};

const privateKeyHexAtPath = (mnemonic: string, path: string): string => {
  const root = HDKey.fromMasterSeed(seedFromMnemonic(mnemonic));
  const child = root.derive(path);
  if (!child.privateKey) throw new Error('Failed to derive key');
  const hex = Array.from(child.privateKey)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
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
  const tronKey = privateKeyHexAtPath(mnemonic, DERIVATION_PATHS.TRC20);
  const evmKey = privateKeyHexAtPath(mnemonic, DERIVATION_PATHS.ERC20);

  return {
    TRC20: tronAddressFromPrivateKey(tronKey),
    ERC20: evmAddressFromPrivateKey(evmKey),
    BEP20: evmAddressFromPrivateKey(evmKey),
    POLYGON: evmAddressFromPrivateKey(evmKey),
    SOL: solanaAddressFromMnemonic(mnemonic),
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
    case 'SOL':
      throw new Error('Solana send is not supported yet');
    case 'ERC20':
    case 'BEP20':
    case 'POLYGON':
      return privateKeyHexAtPath(mnemonic, DERIVATION_PATHS.ERC20);
    default:
      throw new Error('Unsupported network');
  }
};

export const encryptMnemonic = async (mnemonic: string, pin: string): Promise<string> => {
  const wallet = HDNodeWallet.fromPhrase(mnemonic);
  return wallet.encrypt(pin);
};

export const decryptMnemonic = async (encryptedJson: string, pin: string): Promise<string> => {
  const wallet = await Wallet.fromEncryptedJson(encryptedJson, pin);
  if (!('mnemonic' in wallet) || !wallet.mnemonic) {
    throw new Error('Could not recover mnemonic');
  }
  return wallet.mnemonic.phrase;
};

export const addressesToWalletPayload = (
  addresses: DerivedWalletAddresses
): Array<{ network: UsdtNetwork; address: string }> => {
  return (Object.entries(addresses) as [UsdtNetwork, string][])
    .filter(([, address]) => Boolean(address))
    .map(([network, address]) => ({ network, address }));
};
