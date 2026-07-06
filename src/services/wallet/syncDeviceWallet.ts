import { api } from '../api';
import {
  hydrateLocalWalletAddresses,
  getActiveWalletRecord,
  isWalletSetupLocally,
  saveWalletAddresses,
  setActiveWallet,
  type StoredWalletAddress,
} from './walletStorage';
import { triggerDashboardRefresh } from '../../utils/dashboardRefresh';

const SYNC_COOLDOWN_MS = 45_000;
let lastSyncAt = 0;
let lastSyncFingerprint = '';
let syncInFlight: Promise<boolean> | null = null;

let addressFilterCache: { at: number; value: StoredWalletAddress[] } | null = null;
const ADDRESS_FILTER_CACHE_MS = 30_000;

export function invalidateWalletAddressFilterCache(): void {
  addressFilterCache = null;
}

const walletFingerprint = (wallets: StoredWalletAddress[]): string =>
  wallets
    .map((w) => `${w.network}:${w.address.trim().toLowerCase()}`)
    .sort()
    .join('|');

/**
 * Addresses used to filter balances/history for the active merchant wallet.
 * Falls back to server-registered addresses when local vault is empty (common on web).
 */
export async function resolveWalletAddressesForFilter(): Promise<StoredWalletAddress[]> {
  if (addressFilterCache && Date.now() - addressFilterCache.at < ADDRESS_FILTER_CACHE_MS) {
    return addressFilterCache.value;
  }

  const active = await getActiveWalletRecord();
  if (active?.addresses?.length) {
    addressFilterCache = { at: Date.now(), value: active.addresses };
    return active.addresses;
  }

  const local = await hydrateLocalWalletAddresses();
  if (local?.length) {
    addressFilterCache = { at: Date.now(), value: local };
    return local;
  }

  try {
    const res = await api.getWallets();
    const value = res.data.wallets.map((row) => ({
      network: row.network,
      address: row.address,
    }));
    addressFilterCache = { at: Date.now(), value };
    return value;
  } catch {
    return [];
  }
}

export async function resolveActiveWalletAddresses(): Promise<StoredWalletAddress[] | null> {
  const filtered = await resolveWalletAddressesForFilter();
  return filtered.length ? filtered : null;
}

/**
 * Push active wallet addresses to the server (throttled — skips duplicate syncs within 45s).
 */
export async function syncDeviceWalletToServer(options?: { force?: boolean }): Promise<boolean> {
  if (!(await isWalletSetupLocally())) return false;

  const wallets = await resolveActiveWalletAddresses();
  if (!wallets?.length) return false;

  const fingerprint = walletFingerprint(wallets);
  const force = options?.force ?? false;

  if (
    !force &&
    syncInFlight == null &&
    Date.now() - lastSyncAt < SYNC_COOLDOWN_MS &&
    fingerprint === lastSyncFingerprint
  ) {
    return true;
  }

  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const res = await api.syncWallets(wallets);
      const synced = res.data.wallets.map((w) => ({
        network: w.network,
        address: w.address,
      }));
      await saveWalletAddresses(synced);
      lastSyncAt = Date.now();
      lastSyncFingerprint = fingerprint;
      invalidateWalletAddressFilterCache();
      return true;
    } catch {
      return false;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

/** Fire-and-forget server sync — never blocks UI. Throttled to avoid duplicate work across tabs. */
let lastBackgroundTriggerAt = 0;
const BACKGROUND_TRIGGER_MS = 12_000;

export function syncDeviceWalletInBackground(options?: { force?: boolean }): void {
  if (!options?.force && Date.now() - lastBackgroundTriggerAt < BACKGROUND_TRIGGER_MS) {
    return;
  }
  lastBackgroundTriggerAt = Date.now();
  void syncDeviceWalletToServer(options);
}

export async function syncWalletAddressesInBackground(
  wallets: StoredWalletAddress[]
): Promise<void> {
  try {
    await api.syncWallets(wallets);
  } catch {
    // Server sync can finish after the setup screen — local wallet is already saved.
  }
}

export async function persistAndSyncWalletAddresses(
  wallets: StoredWalletAddress[]
): Promise<void> {
  await saveWalletAddresses(wallets);
  await api.syncWallets(wallets);
  lastSyncAt = Date.now();
  lastSyncFingerprint = walletFingerprint(wallets);
}

/** Switch the active local wallet and sync its addresses to the server. */
export async function activateLocalWallet(walletId: string): Promise<boolean> {
  const wallet = await setActiveWallet(walletId);
  if (!wallet) return false;

  if (wallet.addresses.length) {
    invalidateWalletAddressFilterCache();
    await syncDeviceWalletToServer({ force: true });
  }

  triggerDashboardRefresh();
  return true;
}
