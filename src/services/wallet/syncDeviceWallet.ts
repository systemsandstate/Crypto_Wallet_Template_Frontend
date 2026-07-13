import { api, invalidateCachedGet } from '../api';
import { filterSupportedWalletAddresses } from '../../utils/walletSync';
import {
  hydrateLocalWalletAddresses,
  getActiveWalletRecord,
  isWalletSetupLocally,
  saveWalletAddresses,
  persistTrc20OwnerEoa,
  type StoredWalletAddress,
} from './walletStorage';
import {
  canonicalizeWalletAddresses,
  resolveTrc20ReceiveAddressForWallet,
} from './trc20ReceiveAddress';
import { invalidateGasFreeAccountCache } from './gasfreeTronClient';

const SYNC_COOLDOWN_MS = 45_000;
let lastSyncAt = 0;
let lastSyncFingerprint = '';
let syncInFlight: Promise<boolean> | null = null;

let addressFilterCache: { at: number; value: StoredWalletAddress[] } | null = null;
const ADDRESS_FILTER_CACHE_MS = 30_000;
let addressFilterInFlight: Promise<StoredWalletAddress[]> | null = null;

export function invalidateWalletAddressFilterCache(): void {
  addressFilterCache = null;
  invalidateGasFreeAccountCache();
}

const walletFingerprint = (wallets: StoredWalletAddress[] | null | undefined): string =>
  (wallets ?? [])
    .map((w) => `${w.network}:${w.address.trim().toLowerCase()}`)
    .sort()
    .join('|');

async function canonicalizeWithOwner(
  wallets: StoredWalletAddress[]
): Promise<{ wallets: StoredWalletAddress[]; ownerEoa: string | null }> {
  const active = await getActiveWalletRecord();
  let ownerEoa = active?.trc20OwnerEoa?.trim() || null;
  const trc20 = wallets.find((row) => row.network === 'TRC20')?.address?.trim();
  if (trc20) {
    const resolved = await resolveTrc20ReceiveAddressForWallet(trc20, ownerEoa);
    if (resolved.ownerEoa && !ownerEoa) {
      ownerEoa = resolved.ownerEoa;
      await persistTrc20OwnerEoa(resolved.ownerEoa);
    }
  }
  const canonical = await canonicalizeWalletAddresses(wallets, ownerEoa);
  return { wallets: canonical, ownerEoa };
}

/**
 * Addresses used to filter balances/history for the active merchant wallet.
 * Falls back to server-registered addresses when local vault is empty (common on web).
 */
export async function resolveWalletAddressesForFilter(): Promise<StoredWalletAddress[]> {
  if (addressFilterCache && Date.now() - addressFilterCache.at < ADDRESS_FILTER_CACHE_MS) {
    return addressFilterCache.value;
  }
  if (addressFilterInFlight) return addressFilterInFlight;

  addressFilterInFlight = (async () => {
    try {
      const { repairWalletAddresses } = await import('./walletCore');

      const active = await getActiveWalletRecord();
      if (active?.addresses?.length) {
        const repaired = filterSupportedWalletAddresses(repairWalletAddresses(active.addresses));
        const { wallets: canonical } = await canonicalizeWithOwner(repaired);
        const changed = canonical.some((row, i) => row.address !== active.addresses[i]?.address);
        if (changed) {
          await saveWalletAddresses(canonical);
          void api.syncWallets(canonical).catch(() => undefined);
        }
        addressFilterCache = { at: Date.now(), value: canonical };
        return canonical;
      }

      const local = await hydrateLocalWalletAddresses();
      if (local?.length) {
        const { wallets: canonical } = await canonicalizeWithOwner(local);
        addressFilterCache = { at: Date.now(), value: canonical };
        return canonical;
      }

      try {
        const res = await api.getWallets();
        const raw = filterSupportedWalletAddresses(
          repairWalletAddresses(
            (res.data?.wallets ?? []).map((row) => ({
              network: row.network,
              address: row.address,
            }))
          )
        );
        const { wallets: canonical } = await canonicalizeWithOwner(raw);
        addressFilterCache = { at: Date.now(), value: canonical };
        return canonical;
      } catch {
        return [];
      }
    } catch {
      return [];
    } finally {
      addressFilterInFlight = null;
    }
  })();

  return addressFilterInFlight;
}

export async function resolveActiveWalletAddresses(): Promise<StoredWalletAddress[] | null> {
  const filtered = await resolveWalletAddressesForFilter();
  return filtered.length ? filtered : null;
}

/** Resolve wallet addresses once, then kick off throttled background server sync. */
export async function prepareWalletContext(): Promise<StoredWalletAddress[]> {
  const addresses = await resolveWalletAddressesForBalanceFilter();
  syncDeviceWalletInBackground();
  return addresses;
}

/** Single canonical address per network for balance and history filtering. */
export async function resolveWalletAddressesForBalanceFilter(): Promise<StoredWalletAddress[]> {
  return resolveWalletAddressesForFilter();
}

/** Always sync the user-facing GasFree TRC20 address — never downgrade to owner EOA. */
const reconcileWalletsForServerSync = async (
  localWallets: StoredWalletAddress[],
  options?: { alreadyCanonical?: boolean }
): Promise<StoredWalletAddress[]> => {
  const { wallets, ownerEoa } = options?.alreadyCanonical
    ? {
        wallets: localWallets,
        ownerEoa: (await getActiveWalletRecord())?.trc20OwnerEoa?.trim() || null,
      }
    : await canonicalizeWithOwner(localWallets);

  try {
    const res = await api.getWallets();
    const serverTrc20 = res.data?.wallets?.find((row) => row.network === 'TRC20')?.address?.trim();
    const localTrc20 = wallets.find((row) => row.network === 'TRC20')?.address?.trim();
    if (!serverTrc20 || !localTrc20 || serverTrc20 === localTrc20) {
      return wallets;
    }

    const { isGasFreeConfigured } = await import('../../config/gasfree');
    if (isGasFreeConfigured()) {
      const { trc20WalletAddressesMatch } = await import('./trc20ReceiveAddress');
      if (trc20WalletAddressesMatch(serverTrc20, localTrc20, ownerEoa)) {
        return wallets;
      }
      // Server has stale owner EOA or old row — push canonical GasFree address.
      return wallets;
    }

    return (wallets ?? []).map((row) =>
      row.network === 'TRC20' ? { ...row, address: serverTrc20 } : row
    );
  } catch {
    return wallets;
  }
};

/**
 * Push active wallet addresses to the server (throttled — skips duplicate syncs within 45s).
 */
export async function syncDeviceWalletToServer(options?: { force?: boolean }): Promise<boolean> {
  if (!(await isWalletSetupLocally())) return false;

  const localWallets = await resolveActiveWalletAddresses();
  if (!localWallets?.length) return false;

  const wallets = await reconcileWalletsForServerSync(localWallets, { alreadyCanonical: true });

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
      const synced = (res.data.wallets ?? wallets).map((w) => ({
        network: w.network,
        address: w.address,
      }));
      await saveWalletAddresses(synced);
      lastSyncAt = Date.now();
      lastSyncFingerprint = fingerprint;
      invalidateWalletAddressFilterCache();
      invalidateCachedGet('/merchant/wallets');
      invalidateCachedGet('/merchant/wallets/balances');
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
    const reconciled = await reconcileWalletsForServerSync(wallets);
    await api.syncWallets(reconciled);
    await saveWalletAddresses(reconciled);
    invalidateWalletAddressFilterCache();
  } catch {
    // Server sync can finish after the setup screen — local wallet is already saved.
  }
}

export async function persistAndSyncWalletAddresses(
  wallets: StoredWalletAddress[]
): Promise<void> {
  const reconciled = await reconcileWalletsForServerSync(wallets);
  await saveWalletAddresses(reconciled);
  await api.syncWallets(reconciled);
  lastSyncAt = Date.now();
  lastSyncFingerprint = walletFingerprint(reconciled);
}
