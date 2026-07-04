import type { WalletTransfer } from "../services/api";

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
