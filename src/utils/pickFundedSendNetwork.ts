import { DEFAULT_USDT_NETWORK, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";

/** Prefer cheaper/more reliable rails first — hide this ranking from end users. */
const SEND_NETWORK_PRIORITY: UsdtNetwork[] = ["BEP20", "TRC20", "ERC20"];

/** Rough fee rank used when multiple funded routes exist (lower is better). */
const FEE_RANK: Record<UsdtNetwork, number> = {
    BEP20: 0,
    TRC20: 1,
    ERC20: 2,
};

export type SendRouteCandidate = {
    network: UsdtNetwork;
    address: string;
};

/** Prefer a network that can cover amount + fee, then fall back to highest balance. */
export function orderSendRouteCandidates(
    candidates: SendRouteCandidate[] | null | undefined,
    balances: Record<string, number | null | undefined>,
    amount: number,
    feeUsdt = 0
): SendRouteCandidate[] {
    const routes = candidates ?? [];
    if (!routes.length) return [];
    const allowed = new Set(routes.map((row) => row.network));
    const byNetwork = Object.fromEntries(routes.map((row) => [row.network, row])) as Partial<
        Record<UsdtNetwork, SendRouteCandidate>
    >;

    const funded = SEND_NETWORK_PRIORITY.filter((network) => {
        if (!allowed.has(network) || !byNetwork[network]) return false;
        const balance = balances[network];
        return balance != null && balance >= amount + feeUsdt;
    }).map((network) => byNetwork[network]!);

    if (funded.length > 0) {
        return [...funded].sort(
            (a, b) => (FEE_RANK[a.network] ?? 99) - (FEE_RANK[b.network] ?? 99)
        );
    }

    const ranked = [...routes].sort((a, b) => {
        const balA = balances[a.network] ?? 0;
        const balB = balances[b.network] ?? 0;
        if (balB !== balA) return balB - balA;
        return (FEE_RANK[a.network] ?? 99) - (FEE_RANK[b.network] ?? 99);
    });

    return ranked.length > 0 ? ranked : routes;
}

export function pickFundedNetworkLabel(
    balances: Record<string, number | null | undefined>,
    allowedNetworks: UsdtNetwork[],
    amount: number,
    feeUsdt = 0
): UsdtNetwork | null {
    for (const network of SEND_NETWORK_PRIORITY) {
        if (!allowedNetworks.includes(network)) continue;
        const balance = balances[network];
        if (balance != null && balance >= amount + feeUsdt) return network;
    }

    let best: UsdtNetwork | null = null;
    let bestBalance = -1;
    for (const network of allowedNetworks) {
        const balance = balances[network] ?? 0;
        if (balance > bestBalance) {
            bestBalance = balance;
            best = network;
        }
    }
    return best;
}

export function routesFromQrAddresses(
    addresses: Partial<Record<UsdtNetwork, string>>
): SendRouteCandidate[] {
    return USDT_NETWORKS.filter((network) => Boolean(addresses[network]?.trim())).map((network) => ({
        network,
        address: addresses[network]!.trim(),
    }));
}

export function defaultRoute(
    network: UsdtNetwork,
    address: string
): SendRouteCandidate[] {
    return [{ network: network || DEFAULT_USDT_NETWORK, address: address.trim() }];
}
