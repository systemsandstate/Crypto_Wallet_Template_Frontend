import { USDT_NETWORKS, UsdtNetwork } from '../constants/usdtNetworks';

export type WalletAddressRow = { network: string; address: string };

/** One address per supported network — drops legacy SOL/Polygon and duplicate rows. */
export function filterSupportedWalletAddresses(
  wallets: WalletAddressRow[] | null | undefined
): Array<{ network: UsdtNetwork; address: string }> {
  const byNetwork = new Map<UsdtNetwork, string>();
  for (const row of wallets ?? []) {
    if (!(USDT_NETWORKS as readonly string[]).includes(row.network)) continue;
    const network = row.network as UsdtNetwork;
    const address = String(row.address ?? '').trim();
    if (!address) continue;
    if (!byNetwork.has(network)) byNetwork.set(network, address);
  }
  return USDT_NETWORKS.flatMap((network) => {
    const address = byNetwork.get(network);
    return address ? [{ network, address }] : [];
  });
}

export const walletsForServerSync = filterSupportedWalletAddresses;
