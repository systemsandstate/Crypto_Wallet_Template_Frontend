import type { WalletTransfer } from "../services/api";

export type BalanceAddressRow = {
    network?: string;
    address?: string;
    usdtBalance: number | null | undefined;
};

export const sumWalletBalances = (
    rows: Array<{ usdtBalance: number | null | undefined }>
): number =>
    rows.reduce((total, row) => total + (typeof row.usdtBalance === "number" ? row.usdtBalance : 0), 0);

/** Net USDT from history (deposits − sends). */
export const netUsdtFromTransfers = (transfers: WalletTransfer[]): number =>
    transfers.reduce((total, row) => {
        if (row.currency !== "USDT") return total;
        const amount = Number(row.amount) || 0;
        return row.type === "SEND" ? total - amount : total + amount;
    }, 0);

const addressKey = (network: string, address: string) => {
    const trimmed = address.trim();
    const normalized =
        network === "TRC20" || network === "SOL" ? trimmed : trimmed.toLowerCase();
    return `${network}:${normalized}`;
};

/**
 * Keep only balance rows that belong to the active device wallet addresses.
 * Drops stale server rows from a previously active wallet.
 */
export const filterBalancesForActiveWallet = <T extends BalanceAddressRow>(
    balances: T[],
    activeAddresses: Array<{ network: string; address: string }> | null | undefined
): T[] => {
    if (!activeAddresses?.length) return [];
    const allowed = new Set(
        activeAddresses.map((row) => addressKey(row.network, row.address))
    );
    return balances.filter(
        (row) =>
            row.network &&
            row.address &&
            allowed.has(addressKey(row.network, row.address))
    );
};

/** Map filtered balance rows to one value per network (active device wallet only). */
export const networkBalancesFromRows = (
    balances: BalanceAddressRow[],
    activeAddresses: Array<{ network: string; address: string }> | null | undefined
): Record<string, number | null> => {
    const map: Record<string, number | null> = {};
    for (const row of filterBalancesForActiveWallet(balances, activeAddresses)) {
        if (row.network) {
            map[row.network] = row.usdtBalance ?? null;
        }
    }
    return map;
};

/**
 * Prefer balances for the active device wallet. If the address cache is stale,
 * fall back to the best on-chain reading per network so send/history still work.
 */
export const resolveNetworkBalanceMap = (
    balances: BalanceAddressRow[],
    activeAddresses: Array<{ network: string; address: string }> | null | undefined
): Record<string, number | null> => {
    return networkBalancesFromRows(balances, activeAddresses);
};

export const networkNativeBalancesFromRows = (
    balances: Array<BalanceAddressRow & { nativeBalance?: number | null }>,
    activeAddresses: Array<{ network: string; address: string }> | null | undefined
): Record<string, number | null> => {
    const map: Record<string, number | null> = {};
    for (const row of filterBalancesForActiveWallet(balances, activeAddresses)) {
        if (row.network) {
            map[row.network] = row.nativeBalance ?? null;
        }
    }
    return map;
};

export const resolveNetworkNativeBalanceMap = (
    balances: Array<BalanceAddressRow & { nativeBalance?: number | null }>,
    activeAddresses: Array<{ network: string; address: string }> | null | undefined
): Record<string, number | null> => {
    return networkNativeBalancesFromRows(balances, activeAddresses);
};

/**
 * History rows shown in the UI: real on-chain/client txs only (no balance_sync gaps),
 * deduped by network + direction + tx hash + currency.
 */
export const filterTransfersForDisplay = (transfers: WalletTransfer[]): WalletTransfer[] => {
    const seen = new Set<string>();
    const result: WalletTransfer[] = [];

    for (const row of transfers) {
        if (row.source === "balance_sync") continue;

        const dedupeKey = row.txHash
            ? `${row.network}:${row.type}:${row.txHash}:${row.currency}`
            : row.id;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        result.push(row);
    }

    return result;
};

/** Keep only transfers that touch the active wallet addresses. */
export const filterTransfersForActiveWallet = (
    transfers: WalletTransfer[],
    activeAddresses: Array<{ network: string; address: string }> | null | undefined
): WalletTransfer[] => {
    if (!activeAddresses?.length) return [];
    const allowed = new Set(
        activeAddresses.map((row) => addressKey(row.network, row.address))
    );
    const filtered = transfers.filter((row) => {
        const network = row.network;
        if (!network) return false;
        if (row.type === "SEND") {
            return Boolean(row.fromAddress) && allowed.has(addressKey(network, row.fromAddress));
        }
        return Boolean(row.toAddress) && allowed.has(addressKey(network, row.toAddress));
    });
    return filtered;
};

type ActivityRow = {
    key: string;
    sortAt: number;
    kind: "payment" | "deposit";
};

/** Recent activity: newest items first, but always include recent receives when present. */
export const buildRecentActivityRows = <
    T extends ActivityRow & { deposit?: WalletTransfer; payment?: unknown }
>(
    paymentRows: T[],
    transferRows: T[],
    limit = 8
): T[] => {
    const byTime = (a: T, b: T) => b.sortAt - a.sortAt;
    const merged = [...paymentRows, ...transferRows].sort(byTime);
    const recent = merged.slice(0, limit);
    const hasReceive = recent.some(
        (row) => row.kind === "deposit" && row.deposit?.type === "DEPOSIT"
    );
    if (hasReceive) return recent;

    const receives = transferRows
        .filter((row) => row.kind === "deposit" && row.deposit?.type === "DEPOSIT")
        .sort(byTime)
        .slice(0, 2);
    if (!receives.length) return recent;

    const keys = new Set(recent.map((row) => row.key));
    const combined = [...recent];
    for (const row of receives) {
        if (!keys.has(row.key)) combined.push(row);
    }
    return combined.sort(byTime).slice(0, limit);
};

/**
 * Prefer live on-chain balance for the wallet registered on this device.
 * If RPC fails entirely (all null), fall back to history net for that wallet only.
 */
export const resolveDisplayUsdtBalance = (
    balances: Array<{ usdtBalance: number | null | undefined }>,
    transfers: WalletTransfer[]
): number => {
    const live = sumWalletBalances(balances);
    const hasLiveReading = balances.some((row) => typeof row.usdtBalance === "number");
    if (hasLiveReading) return live;
    return Math.max(0, netUsdtFromTransfers(transfers));
};
