import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { triggerWalletSetupRefresh } from '../../utils/walletSetupRefresh';
import { filterSupportedWalletAddresses } from '../../utils/walletSync';

const WALLET_STORAGE_KEY = 'merchantWalletEncrypted';
const LEGACY_WALLET_MERCHANT_KEY = `${WALLET_STORAGE_KEY}:merchantId`;
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
  /** Plain TRON EOA from mnemonic — used to derive GasFree receive address. */
  trc20OwnerEoa?: string;
  /** App install that created this wallet — wallets from other devices are hidden. */
  deviceId?: string;
  /** Set only when the user completes WalletSetup on this device (not migration/sync). */
  createdViaSetup?: boolean;
};

/** One wallet per merchant account (vault may temporarily hold migrations). */
type WalletVault = {
  version: 3;
  activeWalletId: string | null;
  wallets: LocalWalletRecord[];
};

let vaultCache: { merchantId: string; vault: WalletVault } | null = null;

const invalidateVaultCache = (): void => {
  vaultCache = null;
};

const DEFAULT_WALLET_NAME = 'My Wallet';

/** Collapse any multi-wallet vault down to a single active record. */
const toSingleWalletVault = (vault: WalletVault): WalletVault => {
  if (vault.wallets.length <= 1) {
    const only = vault.wallets[0] ?? null;
    return {
      version: 3,
      activeWalletId: only?.id ?? null,
      wallets: only ? [only] : [],
    };
  }
  const active =
    vault.wallets.find((w) => w.id === vault.activeWalletId) ?? vault.wallets[0];
  return {
    version: 3,
    activeWalletId: active.id,
    wallets: [active],
  };
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

const isLikelyEncryptedMnemonic = (value: string): boolean => {
  if (value.length < 80 || (!value.startsWith('{') && !value.startsWith('['))) {
    return false;
  }
  try {
    const parsed = JSON.parse(value) as {
      crypto?: { cipher?: string; kdf?: string };
      Crypto?: { cipher?: string; kdf?: string };
    };
    // ethers v6 writes "Crypto"; some tooling uses lowercase "crypto".
    const crypto = parsed.crypto ?? parsed.Crypto;
    return Boolean(crypto?.cipher && crypto?.kdf);
  } catch {
    return value.length >= 80;
  }
};

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
  await writeKey(LEGACY_WALLET_MERCHANT_KEY, null);
};

/** Drop cached legacy wallet + active merchant on logout; per-merchant vaults stay on device. */
export const clearWalletSession = async (): Promise<void> => {
  invalidateVaultCache();
  await writeKey(ACTIVE_MERCHANT_KEY, null);
  await clearLegacyWalletKeys();
};

const listMerchantVaultIds = async (): Promise<string[]> => {
  const prefix = `${WALLET_VAULT_KEY}:`;
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return [];
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const merchantId = key.slice(prefix.length);
      if (merchantId && localStorage.getItem(key)) ids.push(merchantId);
    }
    return ids;
  }

  const keys = await AsyncStorage.getAllKeys();
  return keys
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .filter(Boolean);
};

const hasOtherMerchantVaults = async (merchantId: string): Promise<boolean> => {
  const ids = await listMerchantVaultIds();
  return ids.some((id) => id !== merchantId);
};

/** Global legacy keys belong to one merchant — never import into a different account. */
const canUseLegacyWalletForMerchant = async (merchantId: string): Promise<boolean> => {
  const legacyOwner = await readKey(LEGACY_WALLET_MERCHANT_KEY);
  if (legacyOwner) return legacyOwner === merchantId;
  // Untagged legacy (pre multi-account): only migrate when no other merchant vault exists.
  return !(await hasOtherMerchantVaults(merchantId));
};

const dedupeWalletAcrossMerchants = async (merchantId: string): Promise<void> => {
  const vault = await loadVaultRaw(merchantId);
  const active = vault?.wallets[0];
  if (!active?.encryptedMnemonic) return;

  const merchantIds = await listMerchantVaultIds();
  let canonicalMerchantId: string | null = null;
  let earliestCreatedAt = active.createdAt;

  for (const id of merchantIds) {
    const candidateVault = await loadVaultRaw(id);
    const candidate = candidateVault?.wallets[0];
    if (candidate?.encryptedMnemonic !== active.encryptedMnemonic) continue;

    if (!canonicalMerchantId || candidate.createdAt < earliestCreatedAt) {
      canonicalMerchantId = id;
      earliestCreatedAt = candidate.createdAt;
    }
  }

  if (canonicalMerchantId && canonicalMerchantId !== merchantId) {
    await saveVault(emptyVault(), merchantId);
    invalidateVaultCache();
  }
};

/** Call after login so vault reads are scoped to the signed-in merchant. */
export const setWalletMerchantContext = async (merchantId: string): Promise<void> => {
  invalidateVaultCache();
  await writeKey(ACTIVE_MERCHANT_KEY, merchantId);
  await purgeInvalidDeviceWallets(merchantId);
  await dedupeWalletAcrossMerchants(merchantId);
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

/** Wallets with decryptable mnemonic on this install are usable (one wallet per account). */
const belongsToThisDevice = (wallet: LocalWalletRecord, deviceId: string): boolean => {
  if (!isLikelyEncryptedMnemonic(wallet.encryptedMnemonic ?? '')) return false;
  if (wallet.createdViaSetup === true && wallet.deviceId === deviceId) return true;
  // Adopt after device-id rotate / SecureStore wipe / old multi-device records.
  if (!wallet.deviceId || wallet.deviceId === deviceId) return true;
  return wallet.createdViaSetup === true;
};

const filterVaultForDevice = (vault: WalletVault, deviceId: string): WalletVault => {
  const wallets = vault.wallets.filter((w) => belongsToThisDevice(w, deviceId));
  const activeWalletId =
    vault.activeWalletId && wallets.some((w) => w.id === vault.activeWalletId)
      ? vault.activeWalletId
      : wallets[0]?.id ?? null;
  return { version: 3, activeWalletId, wallets };
};

const purgeInvalidDeviceWallets = async (merchantId: string): Promise<void> => {
  const deviceId = await getOrCreateDeviceId();
  const vault = await loadVaultRaw(merchantId);

  if (!vault?.wallets.length) {
    return;
  }

  const adopted = adoptNativeLegacyWallets(vault, deviceId);
  const pruned = filterVaultForDevice(adopted, deviceId);

  if (pruned.wallets.length) {
    if (vaultChanged(vault, adopted) || vaultChanged(adopted, pruned)) {
      await saveVault(pruned, merchantId);
    }
    return;
  }

  await saveVault(emptyVault(), merchantId);
};

const syncLegacyKeys = async (vault: WalletVault, merchantId: string): Promise<void> => {
  const active = vault.wallets.find((w) => w.id === vault.activeWalletId) ?? vault.wallets[0] ?? null;
  if (!active) {
    await clearLegacyWalletKeys();
    return;
  }
  await Promise.all([
    writeKey(WALLET_STORAGE_KEY, active.encryptedMnemonic),
    writeKey(WALLET_SETUP_KEY, 'true'),
    writeKey(WALLET_ADDRESSES_KEY, JSON.stringify(active.addresses)),
    writeKey(LEGACY_WALLET_MERCHANT_KEY, merchantId),
    active.deviceId
      ? writeKey(`${WALLET_STORAGE_KEY}:deviceId`, active.deviceId)
      : Promise.resolve(),
  ]);
};

const saveVault = async (vault: WalletVault, merchantId: string): Promise<void> => {
  await writeKey(vaultKeyForMerchant(merchantId), JSON.stringify(vault));
  await syncLegacyKeys(vault, merchantId);
  vaultCache = { merchantId, vault };
};

const normalizeVault = (parsed: WalletVault | null): WalletVault | null => {
  if (!parsed || !Array.isArray(parsed.wallets)) return null;
  const wallets = parsed.wallets.filter(
    (w) => w?.id && w?.encryptedMnemonic && Array.isArray(w.addresses)
  );
  const version = Number((parsed as { version?: number }).version);
  if (!wallets.length && version !== 2 && version !== 3) return null;
  return toSingleWalletVault({
    version: 3,
    activeWalletId: parsed.activeWalletId ?? wallets[0]?.id ?? null,
    wallets,
  });
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
    const adopted = adoptNativeLegacyWallets(parsed, deviceId);
    const scoped = filterVaultForDevice(adopted, deviceId);
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
  let changed = false;
  const wallets = (vault.wallets ?? []).map((wallet) => {
    if (!isLikelyEncryptedMnemonic(wallet.encryptedMnemonic ?? '')) return wallet;

    // One wallet per account: bind any decryptable local record to this install.
    const needsAdopt =
      wallet.createdViaSetup !== true || !wallet.deviceId || wallet.deviceId !== deviceId;
    if (!needsAdopt) return wallet;

    changed = true;
    return {
      ...wallet,
      deviceId,
      createdViaSetup: true,
    };
  });

  return changed ? { ...vault, wallets } : vault;
};

const migrateLegacyToVault = async (merchantId: string, deviceId: string): Promise<WalletVault> => {
  if (!(await canUseLegacyWalletForMerchant(merchantId))) {
    return emptyVault();
  }

  const encrypted = await readKey(WALLET_STORAGE_KEY);
  const addresses = parseAddresses(await readKey(WALLET_ADDRESSES_KEY));

  if (!encrypted || !isLikelyEncryptedMnemonic(encrypted)) {
    return emptyVault();
  }

  const wallet: LocalWalletRecord = {
    id: newWalletId(),
    name: DEFAULT_WALLET_NAME,
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
  before.activeWalletId !== after.activeWalletId ||
  before.wallets.some((w, i) => {
    const next = after.wallets[i];
    return (
      !next ||
      w.id !== next.id ||
      w.deviceId !== next.deviceId ||
      w.createdViaSetup !== next.createdViaSetup ||
      w.encryptedMnemonic !== next.encryptedMnemonic
    );
  });

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
    if (vaultChanged(existing, vault)) {
      await saveVault(vault, merchantId);
    }
  } else {
    vault = await migrateLegacyToVault(merchantId, deviceId);
    vault = filterVaultForDevice(vault, deviceId);
  }

  if (vault.wallets.length > 0 && !vault.activeWalletId) {
    vault.activeWalletId = vault.wallets[0].id;
    await saveVault(vault, merchantId);
  }

  if (vault.wallets.length === 0) {
    const legacyEncrypted = await readKey(WALLET_STORAGE_KEY);
    if (
      legacyEncrypted &&
      isLikelyEncryptedMnemonic(legacyEncrypted) &&
      (await canUseLegacyWalletForMerchant(merchantId))
    ) {
      const recovered = filterVaultForDevice(
        adoptNativeLegacyWallets(await migrateLegacyToVault(merchantId, deviceId), deviceId),
        deviceId
      );
      if (recovered.wallets.length) {
        vault = recovered;
        await saveVault(vault, merchantId);
      }
    } else if (!legacyEncrypted) {
      await clearLegacyWalletKeys();
    }
  }

  vaultCache = { merchantId, vault };
  return vault;
};

export const getActiveWalletRecord = async (): Promise<LocalWalletRecord | null> => {
  const vault = await loadVault();
  return vault.wallets[0] ?? null;
};

export const persistTrc20OwnerEoa = async (ownerEoa: string): Promise<void> => {
  const trimmed = ownerEoa.trim();
  if (!trimmed) return;

  const merchantId = await getWalletMerchantId();
  if (!merchantId) return;

  const vault = await loadVault();
  const active = vault.wallets[0];
  if (!active) return;

  if (active.trc20OwnerEoa === trimmed) return;

  active.trc20OwnerEoa = trimmed;
  await saveVault(toSingleWalletVault({ ...vault, wallets: [active] }), merchantId);
  invalidateVaultCache();
};

/**
 * Create or replace the single wallet on this device from Wallet Setup.
 * One account = one wallet; importing again overwrites the previous local wallet.
 */
export const restoreLocalWalletFromSetup = async (input: {
  name?: string;
  encryptedMnemonic: string;
  addresses: StoredWalletAddress[];
  trc20OwnerEoa?: string;
}): Promise<LocalWalletRecord> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) {
    throw new Error('Sign in before creating a wallet.');
  }

  const deviceId = await getOrCreateDeviceId();
  const vault = await loadVault();
  const existing = vault.wallets[0];

  if (existing && walletsMatch(existing.addresses, input.addresses)) {
    existing.encryptedMnemonic = input.encryptedMnemonic;
    existing.createdViaSetup = true;
    existing.deviceId = deviceId;
    if (input.trc20OwnerEoa?.trim()) existing.trc20OwnerEoa = input.trc20OwnerEoa.trim();
    if (input.name?.trim()) existing.name = input.name.trim();
    await saveVault(toSingleWalletVault({ ...vault, wallets: [existing] }), merchantId);
    await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
    invalidateVaultCache();
    return existing;
  }

  const wallet: LocalWalletRecord = {
    id: existing?.id ?? newWalletId(),
    name: input.name?.trim() || existing?.name || DEFAULT_WALLET_NAME,
    encryptedMnemonic: input.encryptedMnemonic,
    addresses: filterSupportedWalletAddresses(input.addresses),
    trc20OwnerEoa: input.trc20OwnerEoa?.trim() || existing?.trc20OwnerEoa,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    deviceId,
    createdViaSetup: true,
  };
  await saveVault(
    { version: 3, activeWalletId: wallet.id, wallets: [wallet] },
    merchantId
  );
  await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
  invalidateVaultCache();
  return wallet;
};

export const updateActiveWalletAddresses = async (
  addresses: StoredWalletAddress[]
): Promise<void> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) return;

  const vault = await loadVault();
  const active = vault.wallets[0];
  if (!active) return;

  active.addresses = filterSupportedWalletAddresses(addresses);
  await saveVault(toSingleWalletVault({ ...vault, wallets: [active] }), merchantId);
};

export const saveEncryptedWallet = async (encryptedJson: string): Promise<void> => {
  const merchantId = await getWalletMerchantId();
  if (!merchantId) {
    throw new Error('Sign in before creating a wallet.');
  }

  const vault = await loadVault();
  const active = vault.wallets[0];
  if (active) {
    active.encryptedMnemonic = encryptedJson;
    await saveVault(toSingleWalletVault({ ...vault, wallets: [active] }), merchantId);
    return;
  }

  const deviceId = await getOrCreateDeviceId();
  const wallet: LocalWalletRecord = {
    id: newWalletId(),
    name: DEFAULT_WALLET_NAME,
    encryptedMnemonic: encryptedJson,
    addresses: [],
    createdAt: new Date().toISOString(),
    deviceId,
    createdViaSetup: true,
  };
  await saveVault(
    { version: 3, activeWalletId: wallet.id, wallets: [wallet] },
    merchantId
  );
  await writeKey(`${WALLET_STORAGE_KEY}:deviceId`, deviceId);
};

export const loadEncryptedWalletCandidates = async (): Promise<string[]> => {
  const merchantId = await getWalletMerchantId();
  const active = await getActiveWalletRecord();
  const seen = new Set<string>();
  const candidates: string[] = [];

  if (active?.encryptedMnemonic && isLikelyEncryptedMnemonic(active.encryptedMnemonic)) {
    candidates.push(active.encryptedMnemonic);
    seen.add(active.encryptedMnemonic);
  }

  if (!merchantId) return candidates;

  const legacy = await readKey(WALLET_STORAGE_KEY);
  if (
    typeof legacy === 'string' &&
    isLikelyEncryptedMnemonic(legacy) &&
    !seen.has(legacy) &&
    (await canUseLegacyWalletForMerchant(merchantId))
  ) {
    candidates.push(legacy);
  }

  return candidates;
};

export const repairEncryptedWalletIfNeeded = async (workingEncrypted: string): Promise<void> => {
  const active = await getActiveWalletRecord();
  if (active?.encryptedMnemonic === workingEncrypted) return;
  await saveEncryptedWallet(workingEncrypted);
};

export const loadEncryptedWallet = async (): Promise<string | null> => {
  const candidates = await loadEncryptedWalletCandidates();
  return candidates[0] ?? null;
};

/** Rehydrate vault/legacy wallet storage so PIN unlock can read encrypted mnemonic. */
export const ensureLocalWalletForUnlock = async (): Promise<boolean> => {
  if ((await loadEncryptedWalletCandidates()).length > 0) return true;

  const merchantId = await getWalletMerchantId();
  if (!merchantId) return false;

  const legacyEncrypted = await readKey(WALLET_STORAGE_KEY);
  if (!legacyEncrypted || !isLikelyEncryptedMnemonic(legacyEncrypted)) {
    return false;
  }

  invalidateVaultCache();
  const deviceId = await getOrCreateDeviceId();
  await migrateLegacyToVault(merchantId, deviceId);
  invalidateVaultCache();
  return (await loadEncryptedWalletCandidates()).length > 0;
};

export const isWalletSetupLocally = async (): Promise<boolean> => {
  if ((await loadEncryptedWalletCandidates()).length > 0) return true;
  return ensureLocalWalletForUnlock();
};

export const saveWalletAddresses = async (wallets: StoredWalletAddress[]): Promise<void> => {
  await updateActiveWalletAddresses(wallets);
};

export const hydrateLocalWalletAddresses = async (): Promise<StoredWalletAddress[] | null> => {
  const { repairWalletAddresses } = await import('./walletCore');

  const active = await getActiveWalletRecord();
  if (active?.addresses?.length) {
    const repaired = filterSupportedWalletAddresses(repairWalletAddresses(active.addresses));
    const changed =
      repaired.length !== active.addresses.length ||
      repaired.some((row, i) => row.address !== active.addresses[i]?.address || row.network !== active.addresses[i]?.network);
    if (changed) {
      await updateActiveWalletAddresses(repaired);
      void import('../api')
        .then(({ api }) => api.syncWallets(repaired))
        .catch(() => undefined);
    }
    return repaired;
  }

  const merchantId = await getWalletMerchantId();
  if (merchantId && (await canUseLegacyWalletForMerchant(merchantId))) {
    const legacy = parseAddresses(await readKey(WALLET_ADDRESSES_KEY));
    if (legacy.length) {
      const repaired = filterSupportedWalletAddresses(repairWalletAddresses(legacy));
      await updateActiveWalletAddresses(repaired);
      return repaired;
    }
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
