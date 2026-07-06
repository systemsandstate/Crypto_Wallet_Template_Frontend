import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { triggerWalletSetupRefresh } from '../../utils/walletSetupRefresh';

const WALLET_STORAGE_KEY = 'merchantWalletEncrypted';
const WALLET_SETUP_KEY = 'merchantWalletSetupComplete';
const WALLET_ADDRESSES_KEY = 'merchantWalletAddresses';
const WALLET_VAULT_KEY = 'merchantWalletVault';
const MIGRATION_FLAG_KEY = 'merchantWalletSecureMigrated';
const ACTIVE_MERCHANT_KEY = 'merchantWalletActiveMerchantId';
const DEVICE_ID_KEY = 'merchantWalletDeviceId';
const GLOBAL_VAULT_MIGRATED_KEY = 'merchantWalletGlobalVaultMigrated';
const NATIVE_LARGE_STORAGE_REPAIR_KEY = 'merchantWalletLargeStorageRepaired';

export type StoredWalletAddress = { network: string; address: string };

export type LocalWalletRecord = {
  id: string;
  name: string;
  encryptedMnemonic: string;
  addresses: StoredWalletAddress[];
  createdAt: string;
  /** App install that created this wallet — wallets from other devices are hidden. */
  deviceId?: string;
  /** Set only when the user completes WalletSetup on this device (not migration/sync). */
  createdViaSetup?: boolean;
};

export type LocalWalletSummary = {
  id: string;
  name: string;
  addresses: StoredWalletAddress[];
  createdAt: string;
  isActive: boolean;
};

type WalletVault = {
  version: 3;
  activeWalletId: string | null;
  wallets: LocalWalletRecord[];
};

let vaultCache: { merchantId: string; vault: WalletVault } | null = null;

const invalidateVaultCache = (): void => {
  vaultCache = null;
};

const nextWalletNameFromVault = (vault: WalletVault): string => {
  const used = new Set(vault.wallets.map((w) => w.name.trim().toLowerCase()));
  let index = vault.wallets.length + 1;
  let name = `Main Wallet ${index}`;
  while (used.has(name.toLowerCase())) {
    index += 1;
    name = `Main Wallet ${index}`;
  }
  return name;
};

const useSecureStore = Platform.OS !== 'web';
/** iOS SecureStore hard limit; Android warns and may fail above this size. */
const SECURE_STORE_MAX_BYTES = 2048;

const utf8ByteLength = (value: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  let bytes = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i += 1;
    } else bytes += 3;
  }
  return bytes;
};

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

const isLargePayloadKey = (key: string): boolean =>
  key === WALLET_STORAGE_KEY ||
  key === WALLET_ADDRESSES_KEY ||
  key.startsWith(`${WALLET_VAULT_KEY}:`) ||
  key === WALLET_VAULT_KEY;

const isLikelyEncryptedMnemonic = (value: string): boolean =>
  value.length >= 80 && (value.startsWith('{') || value.startsWith('['));

const isLikelyVaultPayload = (value: string): boolean => {
  if (value.length < 100) return false;
  try {
    const parsed = JSON.parse(value) as WalletVault;
    return (
      Array.isArray(parsed?.wallets) &&
      parsed.wallets.some((wallet) => isLikelyEncryptedMnemonic(wallet?.encryptedMnemonic ?? ''))
    );
  } catch {
    return false;
  }
};

const validateLargePayload = (key: string, value: string): boolean => {
  if (key === WALLET_ADDRESSES_KEY) {
    try {
      const parsed = JSON.parse(value) as StoredWalletAddress[];
      return Array.isArray(parsed) && parsed.some((row) => row?.network && row?.address);
    } catch {
      return false;
    }
  }
  if (key === WALLET_STORAGE_KEY) {
    return isLikelyEncryptedMnemonic(value);
  }
  if (key.includes(WALLET_VAULT_KEY)) {
    return isLikelyVaultPayload(value);
  }
  return utf8ByteLength(value) < SECURE_STORE_MAX_BYTES;
};

const deleteSecureStoreKey = async (key: string): Promise<void> => {
  if (!useSecureStore) return;
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
};

const readAsync = async (key: string): Promise<string | null> => {
  // Encrypted mnemonics and vault JSON exceed SecureStore's 2KB limit — prefer AsyncStorage.
  if (useSecureStore && isLargePayloadKey(key)) {
    const asyncValue = await AsyncStorage.getItem(key);
    if (asyncValue != null && validateLargePayload(key, asyncValue)) {
      return asyncValue;
    }

    let secureValue: string | null = null;
    try {
      secureValue = await SecureStore.getItemAsync(key);
    } catch {
      secureValue = null;
    }

    if (secureValue != null) {
      if (validateLargePayload(key, secureValue)) {
        if (asyncValue == null || utf8ByteLength(secureValue) > utf8ByteLength(asyncValue)) {
          await AsyncStorage.setItem(key, secureValue);
        }
        await deleteSecureStoreKey(key);
        return AsyncStorage.getItem(key);
      }
      await deleteSecureStoreKey(key);
    }

    return asyncValue;
  }

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

  const fitsSecureStore = utf8ByteLength(value) < SECURE_STORE_MAX_BYTES;

  if (useSecureStore && fitsSecureStore) {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      // Fall through to AsyncStorage.
    }
  }

  if (useSecureStore) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  }
  await AsyncStorage.setItem(key, value);
};

const readKey = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return readWeb(key);
  return readAsync(key);
};

const writeKey = async (key: string, value: string | null): Promise<void> => {
  if (Platform.OS === 'web') {
    writeWeb(key, value);
    return;
  }
  await writeAsync(key, value);
};

const clearLegacyWalletKeys = async (): Promise<void> => {
  await writeKey(WALLET_STORAGE_KEY, null);
  await writeKey(WALLET_SETUP_KEY, null);
  await writeKey(WALLET_ADDRESSES_KEY, null);
  await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, null);
};

/** Call after login so vault reads are scoped to the signed-in merchant. */
export const setWalletMerchantContext = async (merchantId: string): Promise<void> => {
  invalidateVaultCache();
  await writeKey(ACTIVE_MERCHANT_KEY, merchantId);
  await purgeInvalidDeviceWallets(merchantId);
  triggerWalletSetupRefresh();
};

const getWalletMerchantId = async (): Promise<string | null> => {
  return readKey(ACTIVE_MERCHANT_KEY);
};

const getOrCreateDeviceId = async (): Promise<string> => {
  let deviceId = await readKey(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    await writeKey(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const vaultKeyForMerchant = (merchantId: string): string => `${WALLET_VAULT_KEY}:${merchantId}`;

const migrateLegacyAsyncStorage = async (): Promise<void> => {
  if (!useSecureStore) return;
  const migrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated === 'true') return;

  const legacyWallet = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
  const legacySetup = await AsyncStorage.getItem(WALLET_SETUP_KEY);
  const legacyAddresses = await AsyncStorage.getItem(WALLET_ADDRESSES_KEY);

  if (legacyWallet) {
    await writeAsync(WALLET_STORAGE_KEY, legacyWallet);
  }
  if (legacySetup) {
    await writeAsync(WALLET_SETUP_KEY, legacySetup);
  }
  if (legacyAddresses) {
    await writeAsync(WALLET_ADDRESSES_KEY, legacyAddresses);
  }

  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
};

/** One-time repair: move valid large wallet blobs off SecureStore and drop truncated entries. */
const repairNativeLargeWalletStorage = async (merchantId: string): Promise<void> => {
  if (!useSecureStore) return;
  const repairKey = `${NATIVE_LARGE_STORAGE_REPAIR_KEY}:${merchantId}`;
  const repaired = await AsyncStorage.getItem(repairKey);
  if (repaired === 'true') return;

  const keys = [
    WALLET_STORAGE_KEY,
    WALLET_ADDRESSES_KEY,
    vaultKeyForMerchant(merchantId),
  ];

  for (const key of keys) {
    await readAsync(key);
  }

  await AsyncStorage.setItem(repairKey, 'true');
};

const newWalletId = (): string =>
  `wallet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const addressKey = (network: string, address: string): string =>
  `${network}:${address.trim().toLowerCase()}`;

const walletsMatch = (left: StoredWalletAddress[], right: StoredWalletAddress[]): boolean => {
  if (left.length !== right.length) return false;
  const keys = new Set(left.map((row) => addressKey(row.network, row.address)));
  return right.every((row) => keys.has(addressKey(row.network, row.address)));
};

const parseAddresses = (raw: string | null): StoredWalletAddress[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredWalletAddress[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row?.network && row?.address);
  } catch {
    return [];
  }
};

const emptyVault = (): WalletVault => ({
  version: 3,
  activeWalletId: null,
  wallets: [],
});

/** Only wallets explicitly set up on this device install are visible. */
const belongsToThisDevice = (wallet: LocalWalletRecord, deviceId: string): boolean =>
  wallet.createdViaSetup === true && wallet.deviceId === deviceId;

const filterVaultForDevice = (vault: WalletVault, deviceId: string): WalletVault => {
  const wallets = vault.wallets.filter((w) => belongsToThisDevice(w, deviceId));
  const activeWalletId =
    vault.activeWalletId && wallets.some((w) => w.id === vault.activeWalletId)
      ? vault.activeWalletId
      : wallets[0]?.id ?? null;
  return { version: 3, activeWalletId, wallets };
};

const purgeInvalidDeviceWallets = async (merchantId: string): Promise<void> => {
  const raw = await readKey(vaultKeyForMerchant(merchantId));
  if (!raw) return;

  try {
    const parsed = normalizeVault(JSON.parse(raw) as WalletVault);
    if (!parsed) return;

    const deviceId = await getOrCreateDeviceId();
    const pruned = filterVaultForDevice(parsed, deviceId);
    await saveVault(pruned, merchantId);

    if (pruned.wallets.length === 0) {
      await clearLegacyWalletKeys();
    }
  } catch {
    await writeKey(vaultKeyForMerchant(merchantId), null);
    await clearLegacyWalletKeys();
  }
};

const syncLegacyKeys = async (vault: WalletVault): Promise<void> => {
  const active = vault.wallets.find((w) => w.id === vault.activeWalletId) ?? vault.wallets[0] ?? null;
  if (!active) {
    await clearLegacyWalletKeys();
    return;
  }
  await Promise.all([
    writeKey(WALLET_STORAGE_KEY, active.encryptedMnemonic),
    writeKey(WALLET_SETUP_KEY, 'true'),
    writeKey(WALLET_ADDRESSES_KEY, JSON.stringify(active.addresses)),
    active.deviceId
      ? writeKey(`${WALLET_STORAGE_KEY}:deviceId`, active.deviceId)
      : Promise.resolve(),
  ]);
};

const saveVault = async (vault: WalletVault, merchantId: string): Promise<void> => {
  await writeKey(vaultKeyForMerchant(merchantId), JSON.stringify(vault));
  await syncLegacyKeys(vault);
  vaultCache = { merchantId, vault };
};

const normalizeVault = (parsed: WalletVault | null): WalletVault | null => {
  if (!parsed || !Array.isArray(parsed.wallets)) return null;
  const wallets = parsed.wallets.filter(
    (w) => w?.id && w?.encryptedMnemonic && Array.isArray(w.addresses)
  );
  if (!wallets.length && parsed.version !== 2 && parsed.version !== 3) return null;
  return {
    version: 3,
    activeWalletId: parsed.activeWalletId ?? wallets[0]?.id ?? null,
    wallets,
  };
};

const migrateGlobalVaultToMerchant = async (merchantId: string): Promise<WalletVault | null> => {
  const flag = await readKey(GLOBAL_VAULT_MIGRATED_KEY);
  if (flag === 'true') return null;

  const raw = await readKey(WALLET_VAULT_KEY);
  await writeKey(GLOBAL_VAULT_MIGRATED_KEY, 'true');
  await writeKey(WALLET_VAULT_KEY, null);
  if (!raw) return null;

  try {
    const parsed = normalizeVault(JSON.parse(raw) as WalletVault);
    if (!parsed?.wallets.length) return null;
    const deviceId = await getOrCreateDeviceId();
    const scoped = filterVaultForDevice(parsed, deviceId);
    if (scoped.wallets.length) {
      await saveVault(scoped, merchantId);
    }
    return scoped.wallets.length ? scoped : null;
  } catch {
    return null;
  }
};

const loadVaultRaw = async (merchantId: string): Promise<WalletVault | null> => {
  if (Platform.OS !== 'web') {
    await migrateLegacyAsyncStorage();
    await repairNativeLargeWalletStorage(merchantId);
  }

  await migrateGlobalVaultToMerchant(merchantId);

  const raw = await readKey(vaultKeyForMerchant(merchantId));
  if (!raw) return null;
  try {
    return normalizeVault(JSON.parse(raw) as WalletVault);
  } catch {
    return null;
  }
};

const adoptNativeLegacyWallets = (vault: WalletVault, deviceId: string): WalletVault => {
  if (Platform.OS === 'web') return vault;

  let changed = false;
  const wallets = vault.wallets.map((wallet) => {
    if (wallet.createdViaSetup) return wallet;
    if (!wallet.encryptedMnemonic) return wallet;
    if (wallet.deviceId && wallet.deviceId !== deviceId) return wallet;
    changed = true;
    return {
      ...wallet,
      deviceId: wallet.deviceId ?? deviceId,
      createdViaSetup: true,
    };
  });

  return changed ? { ...vault, wallets } : vault;
};

const migrateLegacyToVault = async (merchantId: string, deviceId: string): Promise<WalletVault> => {
  const encrypted = await readKey(WALLET_STORAGE_KEY);
  const setup = await readKey(WALLET_SETUP_KEY);
  const addresses = parseAddresses(await readKey(WALLET_ADDRESSES_KEY));

  if (!encrypted || setup !== 'true') {
    return emptyVault();
  }

  const legacyDevice = await readKey(`${WALLET_STORAGE_KEY}:deviceId`);
  if (legacyDevice && legacyDevice !== deviceId) {
    return emptyVault();
  }

  const wallet: LocalWalletRecord = {
    id: newWalletId(),
    name: 'Main Wallet 1',
    encryptedMnemonic: encrypted,
    addresses,
    createdAt: new Date().toISOString(),
    deviceId,
    createdViaSetup: true,
  };

  const vault: WalletVault = {
    version: 3,
    activeWalletId: wallet.id,
    wallets: [wallet],
  };
  await saveVault(vault, merchantId);
  await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
  return vault;
};

const vaultChanged = (before: WalletVault, after: WalletVault): boolean =>
  before.wallets.length !== after.wallets.length ||
  before.wallets.some((w, i) => w.id !== after.wallets[i]?.id);

const loadVault = async (): Promise<WalletVault> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) return emptyVault();

  if (vaultCache?.merchantId === merchantId) {
    return vaultCache.vault;
  }

  const deviceId = await getOrCreateDeviceId();
  const existing = await loadVaultRaw(merchantId);

  let vault: WalletVault;
  if (existing) {
    const adopted = adoptNativeLegacyWallets(existing, deviceId);
    vault = filterVaultForDevice(adopted, deviceId);
    if (vaultChanged(existing, adopted)) {
      await saveVault(adopted, merchantId);
    }
  } else {
    vault = await migrateLegacyToVault(merchantId, deviceId);
    vault = filterVaultForDevice(vault, deviceId);
  }

  if (existing && vaultChanged(existing, vault)) {
    await saveVault(vault, merchantId);
  }

  if (vault.wallets.length > 0 && !vault.activeWalletId) {
    vault.activeWalletId = vault.wallets[0].id;
    await saveVault(vault, merchantId);
  }

  if (vault.wallets.length === 0) {
    await clearLegacyWalletKeys();
  }

  vaultCache = { merchantId, vault };
  return vault;
};

export const nextWalletName = async (): Promise<string> => {
  const vault = await loadVault();
  return nextWalletNameFromVault(vault);
};

export const listLocalWallets = async (): Promise<LocalWalletSummary[]> => {
  const vault = await loadVault();
  return vault.wallets.map((wallet) => ({
    id: wallet.id,
    name: wallet.name,
    addresses: wallet.addresses,
    createdAt: wallet.createdAt,
    isActive: wallet.id === vault.activeWalletId,
  }));
};

export const getActiveWalletRecord = async (): Promise<LocalWalletRecord | null> => {
  const vault = await loadVault();
  if (!vault.activeWalletId) return null;
  return vault.wallets.find((w) => w.id === vault.activeWalletId) ?? null;
};

export const addLocalWallet = async (input: {
  name?: string;
  encryptedMnemonic: string;
  addresses: StoredWalletAddress[];
}): Promise<LocalWalletRecord> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) {
    throw new Error('Sign in before creating a wallet.');
  }

  const deviceId = await getOrCreateDeviceId();
  const vault = await loadVault();
  const wallet: LocalWalletRecord = {
    id: newWalletId(),
    name: input.name?.trim() || nextWalletNameFromVault(vault),
    encryptedMnemonic: input.encryptedMnemonic,
    addresses: input.addresses,
    createdAt: new Date().toISOString(),
    deviceId,
    createdViaSetup: true,
  };
  vault.wallets.push(wallet);
  vault.activeWalletId = wallet.id;
  await saveVault(vault, merchantId);
  await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
  return wallet;
};

/**
 * Create or re-activate a wallet on this device from Wallet Setup.
 * Importing a recovery phrase restores wallets created on other phones or browsers.
 */
export const restoreLocalWalletFromSetup = async (input: {
  name?: string;
  encryptedMnemonic: string;
  addresses: StoredWalletAddress[];
}): Promise<LocalWalletRecord> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) {
    throw new Error('Sign in before creating a wallet.');
  }

  const deviceId = await getOrCreateDeviceId();
  const vault = await loadVault();
  const existing = vault.wallets.find((wallet) => walletsMatch(wallet.addresses, input.addresses));

  if (existing) {
    existing.encryptedMnemonic = input.encryptedMnemonic;
    existing.createdViaSetup = true;
    existing.deviceId = deviceId;
    vault.activeWalletId = existing.id;
    await saveVault(vault, merchantId);
    await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
    return existing;
  }

  const wallet: LocalWalletRecord = {
    id: newWalletId(),
    name: input.name?.trim() || nextWalletNameFromVault(vault),
    encryptedMnemonic: input.encryptedMnemonic,
    addresses: input.addresses,
    createdAt: new Date().toISOString(),
    deviceId,
    createdViaSetup: true,
  };
  vault.wallets.push(wallet);
  vault.activeWalletId = wallet.id;
  await saveVault(vault, merchantId);
  await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
  return wallet;
};

export const setActiveWallet = async (walletId: string): Promise<LocalWalletRecord | null> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) return null;

  const vault = await loadVault();
  const wallet = vault.wallets.find((w) => w.id === walletId);
  if (!wallet) return null;
  vault.activeWalletId = walletId;
  await saveVault(vault, merchantId);
  return wallet;
};

export const renameLocalWallet = async (walletId: string, name: string): Promise<boolean> => {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const merchantId = await getWalletMerchantId();
  if (!merchantId) return false;

  const vault = await loadVault();
  const wallet = vault.wallets.find((w) => w.id === walletId);
  if (!wallet) return false;
  wallet.name = trimmed;
  await saveVault(vault, merchantId);
  return true;
};

export const removeLocalWallet = async (walletId: string): Promise<boolean> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) return false;

  const vault = await loadVault();
  const index = vault.wallets.findIndex((w) => w.id === walletId);
  if (index < 0) return false;
  vault.wallets.splice(index, 1);
  if (vault.activeWalletId === walletId) {
    vault.activeWalletId = vault.wallets[0]?.id ?? null;
  }
  await saveVault(vault, merchantId);
  return true;
};

export const updateActiveWalletAddresses = async (
  addresses: StoredWalletAddress[]
): Promise<void> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) return;

  const vault = await loadVault();
  const active = vault.wallets.find((w) => w.id === vault.activeWalletId);
  if (!active) return;

  active.addresses = addresses;
  await saveVault(vault, merchantId);
};

/** @deprecated Prefer addLocalWallet — kept for callers that only store one encrypted blob. */
export const saveEncryptedWallet = async (encryptedJson: string): Promise<void> => {
  const vault = await loadVault();
  const active = vault.wallets.find((w) => w.id === vault.activeWalletId);
  if (active) {
    active.encryptedMnemonic = encryptedJson;
    const merchantId = await getWalletMerchantId();
    if (merchantId) await saveVault(vault, merchantId);
    return;
  }
  await addLocalWallet({
    encryptedMnemonic: encryptedJson,
    addresses: [],
  });
};

export const loadEncryptedWallet = async (): Promise<string | null> => {
  const active = await getActiveWalletRecord();
  if (active?.encryptedMnemonic && isLikelyEncryptedMnemonic(active.encryptedMnemonic)) {
    return active.encryptedMnemonic;
  }
  const legacy = await readKey(WALLET_STORAGE_KEY);
  if (legacy && isLikelyEncryptedMnemonic(legacy)) return legacy;
  return null;
};

export const isWalletSetupLocally = async (): Promise<boolean> => {
  const vault = await loadVault();
  return vault.wallets.length > 0;
};

export const saveWalletAddresses = async (wallets: StoredWalletAddress[]): Promise<void> => {
  await updateActiveWalletAddresses(wallets);
};

export const hydrateLocalWalletAddresses = async (): Promise<StoredWalletAddress[] | null> => {
  const active = await getActiveWalletRecord();
  if (active?.addresses?.length) return active.addresses;

  const legacy = parseAddresses(await readKey(WALLET_ADDRESSES_KEY));
  if (legacy.length) {
    await updateActiveWalletAddresses(legacy);
    return legacy;
  }

  return null;
};

export const loadWalletAddresses = async (): Promise<StoredWalletAddress[] | null> => {
  return hydrateLocalWalletAddresses();
};

export const clearLocalWallet = async (): Promise<void> => {
  invalidateVaultCache();
  const merchantId = await getWalletMerchantId();
  if (merchantId) {
    await writeKey(vaultKeyForMerchant(merchantId), null);
  }
  await writeKey(WALLET_VAULT_KEY, null);
  await clearLegacyWalletKeys();
  if (Platform.OS !== 'web') {
    await AsyncStorage.multiRemove([MIGRATION_FLAG_KEY]);
  }
};
