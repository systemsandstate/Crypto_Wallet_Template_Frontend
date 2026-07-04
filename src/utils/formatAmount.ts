/** Format crypto amounts with enough precision for native gas tokens (BNB, ETH, etc.). */
export function formatNativeAmount(value: number | string | null | undefined, locale = "en-US"): string {
    if (value == null || !Number.isFinite(Number(value))) return "—";
    const num = typeof value === "string" ? parseFloat(value) : value;
    const abs = Math.abs(num);
    const maxDecimals = abs >= 1 ? 6 : abs >= 0.001 ? 8 : 12;
    return num.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals });
}

/** Format USDT/crypto amounts to 2 decimal places for display. */
export function formatUsdtAmount(value: number | string, locale = "en-US"): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    const safe = Number.isFinite(num) ? num : 0;
    return safe.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
