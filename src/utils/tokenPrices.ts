/** Cached USD prices for portfolio total (USDT ≈ $1). */
const FALLBACK_USD: Record<string, number> = {
    USDT: 1,
    BNB: 600,
    ETH: 2500,
    TRX: 0.12,
    POL: 0.45,
    SOL: 150,
};

const PRICE_FETCH_TIMEOUT_MS = 6_000;

let cache: { prices: Record<string, number>; at: number } | null = null;
let refreshInFlight: Promise<Record<string, number>> | null = null;
const CACHE_MS = 10 * 60 * 1000;

async function fetchPricesFromApi(): Promise<Record<string, number>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PRICE_FETCH_TIMEOUT_MS);
    try {
        const url =
            "https://api.coingecko.com/api/v3/simple/price?ids=tether,binancecoin,ethereum,tron,matic-network,solana&vs_currencies=usd";
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("price fetch failed");
        const data = (await res.json()) as Record<string, { usd?: number }>;
        return {
            USDT: data.tether?.usd ?? 1,
            BNB: data.binancecoin?.usd ?? FALLBACK_USD.BNB,
            ETH: data.ethereum?.usd ?? FALLBACK_USD.ETH,
            TRX: data.tron?.usd ?? FALLBACK_USD.TRX,
            POL: data["matic-network"]?.usd ?? FALLBACK_USD.POL,
            SOL: data.solana?.usd ?? FALLBACK_USD.SOL,
        };
    } finally {
        clearTimeout(timer);
    }
}

function refreshPricesInBackground(): void {
    if (refreshInFlight) return;
    refreshInFlight = fetchPricesFromApi()
        .then((prices) => {
            cache = { prices, at: Date.now() };
            return prices;
        })
        .catch(() => cache?.prices ?? { ...FALLBACK_USD })
        .finally(() => {
            refreshInFlight = null;
        });
}

export async function getTokenUsdPrices(): Promise<Record<string, number>> {
    if (cache && Date.now() - cache.at < CACHE_MS) {
        return cache.prices;
    }

    if (cache) {
        refreshPricesInBackground();
        return cache.prices;
    }

    refreshPricesInBackground();
    return { ...FALLBACK_USD };
}
