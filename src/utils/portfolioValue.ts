import type { BalanceAddressRow } from "./walletBalance";

export type PortfolioBalanceRow = BalanceAddressRow & {
    nativeBalance?: number | null;
    nativeSymbol?: string;
};

/** Sum USDT + native gas tokens converted to USD (displayed as $). */
export function computePortfolioUsd(
    balances: PortfolioBalanceRow[],
    prices: Record<string, number>
): number {
    let total = 0;
    for (const row of balances) {
        const usdt = typeof row.usdtBalance === "number" ? row.usdtBalance : 0;
        total += usdt * (prices.USDT ?? 1);

        const native = row.nativeBalance;
        const symbol = String(row.nativeSymbol || "").toUpperCase();
        if (typeof native === "number" && native > 0 && symbol) {
            total += native * (prices[symbol] ?? 0);
        }
    }
    return total;
}
