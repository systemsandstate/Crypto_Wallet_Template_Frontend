import type { BalanceAddressRow } from "./walletBalance";

export type PortfolioBalanceRow = BalanceAddressRow & {
    nativeBalance?: number | null;
    nativeSymbol?: string;
};

/** Sum USDT balances converted to USD (displayed as $). */
export function computePortfolioUsd(
    balances: PortfolioBalanceRow[] | null | undefined,
    prices: Record<string, number>
): number {
    if (!balances?.length) return 0;
    let total = 0;
    for (const row of balances) {
        const usdt = typeof row.usdtBalance === "number" ? row.usdtBalance : 0;
        total += usdt * (prices.USDT ?? 1);
    }
    return total;
}
