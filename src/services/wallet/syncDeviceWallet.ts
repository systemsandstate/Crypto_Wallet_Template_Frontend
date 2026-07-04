import { api } from '../api';
import {
  isWalletSetupLocally,
  loadWalletAddresses,
  saveWalletAddresses,
  type StoredWalletAddress,
} from './walletStorage';

/**
 * Push this device's wallet addresses to the server so balance/history match
 * the wallet created or imported on this device (not an older account wallet).
 */
export async function syncDeviceWalletToServer(): Promise<boolean> {
  if (!(await isWalletSetupLocally())) return false;

  const wallets = await loadWalletAddresses();
  if (!wallets?.length) return false;

  try {
    const res = await api.syncWallets(wallets);
    const synced = res.data.wallets.map((w) => ({
      network: w.network,
      address: w.address,
    }));
    await saveWalletAddresses(synced);
    return true;
  } catch {
    return false;
  }
}

export async function persistAndSyncWalletAddresses(
  wallets: StoredWalletAddress[]
): Promise<void> {
  await saveWalletAddresses(wallets);
  await api.syncWallets(wallets);
}
