import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const WALLET_STORAGE_KEY = 'merchantWalletEncrypted';
const WALLET_SETUP_KEY = 'merchantWalletSetupComplete';
const WALLET_ADDRESSES_KEY = 'merchantWalletAddresses';
const MIGRATION_FLAG_KEY = 'merchantWalletSecureMigrated';

export type StoredWalletAddress = { network: string; address: string };

const useSecureStore = Platform.OS !== 'web';

const readWeb = (key: string): string | null => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeWeb = (key: string, value: string | null) => {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const readAsync = async (key: string): Promise<string | null> => {
  if (useSecureStore) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value != null) return value;
    } catch {
      // fall through to AsyncStorage
    }
  }
  return AsyncStorage.getItem(key);
};

const writeAsync = async (key: string, value: string | null): Promise<void> => {
  if (value == null) {
    if (useSecureStore) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // ignore
      }
    }
    await AsyncStorage.removeItem(key);
    return;
  }

  if (useSecureStore) {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      // iOS SecureStore limit is 2048 bytes — fall back for large encrypted blobs
    }
  }
  await AsyncStorage.setItem(key, value);
};

const migrateLegacyAsyncStorage = async (): Promise<void> => {
  if (!useSecureStore) return;
  const migrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated === 'true') return;

  const legacyWallet = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
  const legacySetup = await AsyncStorage.getItem(WALLET_SETUP_KEY);

  if (legacyWallet) {
    await writeAsync(WALLET_STORAGE_KEY, legacyWallet);
  }
  if (legacySetup) {
    await writeAsync(WALLET_SETUP_KEY, legacySetup);
  }

  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
};

export const saveEncryptedWallet = async (encryptedJson: string): Promise<void> => {
  if (Platform.OS === 'web') {
    writeWeb(WALLET_STORAGE_KEY, encryptedJson);
    writeWeb(WALLET_SETUP_KEY, 'true');
    return;
  }
  await writeAsync(WALLET_STORAGE_KEY, encryptedJson);
  await writeAsync(WALLET_SETUP_KEY, 'true');
};

export const loadEncryptedWallet = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return readWeb(WALLET_STORAGE_KEY);
  }
  await migrateLegacyAsyncStorage();
  return readAsync(WALLET_STORAGE_KEY);
};

export const isWalletSetupLocally = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return readWeb(WALLET_SETUP_KEY) === 'true';
  }
  await migrateLegacyAsyncStorage();
  const flag = await readAsync(WALLET_SETUP_KEY);
  return flag === 'true';
};

export const saveWalletAddresses = async (wallets: StoredWalletAddress[]): Promise<void> => {
  const payload = JSON.stringify(wallets);
  if (Platform.OS === 'web') {
    writeWeb(WALLET_ADDRESSES_KEY, payload);
    return;
  }
  await writeAsync(WALLET_ADDRESSES_KEY, payload);
};

export const loadWalletAddresses = async (): Promise<StoredWalletAddress[] | null> => {
  const raw =
    Platform.OS === 'web' ? readWeb(WALLET_ADDRESSES_KEY) : await readAsync(WALLET_ADDRESSES_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredWalletAddress[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter((row) => row?.network && row?.address);
  } catch {
    return null;
  }
};

export const clearLocalWallet = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    writeWeb(WALLET_STORAGE_KEY, null);
    writeWeb(WALLET_SETUP_KEY, null);
    writeWeb(WALLET_ADDRESSES_KEY, null);
    return;
  }
  await writeAsync(WALLET_STORAGE_KEY, null);
  await writeAsync(WALLET_SETUP_KEY, null);
  await writeAsync(WALLET_ADDRESSES_KEY, null);
  await AsyncStorage.multiRemove([MIGRATION_FLAG_KEY]);
};
