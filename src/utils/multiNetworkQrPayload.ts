import { DEFAULT_USDT_NETWORK, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";

export type UsdtPayQrPayload = {
    v: 1;
    type: "usdt-pay";
    amount?: number;
    currency: "USDT";
    defaultNetwork: UsdtNetwork;
    addresses: Partial<Record<UsdtNetwork, string>>;
    businessName?: string;
};

const formatQrAmount = (amount: number): string => {
    const normalized = Number(amount.toFixed(8));
    return Number.isFinite(normalized) ? String(normalized) : String(amount);
};

const parseQrAmount = (raw: string): number | undefined => {
    const value = parseFloat(raw.replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : undefined;
};

/** Compact multi-network payload — shorter than JSON, no `?` for reliable camera scans. */
export const parseCompactUsdtPayQrPayload = (raw: string): UsdtPayQrPayload | null => {
    const trimmed = raw.trim();
    if (!trimmed.toLowerCase().startsWith("usdtpay:")) return null;

    const body = trimmed.slice("usdtpay:".length);
    const segments = body.split(";").map((part) => part.trim()).filter(Boolean);
    if (!segments.length) return null;

    let amount: number | undefined;
    const addresses: Partial<Record<UsdtNetwork, string>> = {};
    let businessName: string | undefined;
    let defaultNetworkHint: UsdtNetwork | undefined;

    for (const segment of segments) {
        const eq = segment.indexOf("=");
        if (eq <= 0) {
            if (amount == null) {
                amount = parseQrAmount(segment);
            }
            continue;
        }

        const key = segment.slice(0, eq).trim();
        const value = segment.slice(eq + 1).trim();
        if (!value) continue;

        if (key === "bn") {
            businessName = value;
            continue;
        }

        if (key === "dn" && (USDT_NETWORKS as readonly string[]).includes(value)) {
            defaultNetworkHint = value as UsdtNetwork;
            continue;
        }

        if ((USDT_NETWORKS as readonly string[]).includes(key)) {
            addresses[key as UsdtNetwork] = value;
        }
    }

    if (!Object.keys(addresses).length) return null;

    const defaultNetwork =
        (defaultNetworkHint && addresses[defaultNetworkHint]
            ? defaultNetworkHint
            : inputDefaultNetwork(addresses)) ?? DEFAULT_USDT_NETWORK;

    return {
        v: 1,
        type: "usdt-pay",
        currency: "USDT",
        defaultNetwork,
        addresses,
        ...(amount != null ? { amount } : {}),
        ...(businessName ? { businessName } : {}),
    };
};

function inputDefaultNetwork(addresses: Partial<Record<UsdtNetwork, string>>): UsdtNetwork | undefined {
    for (const network of USDT_NETWORKS) {
        if (addresses[network]) return network;
    }
    return undefined;
}

export const isUsdtPayQrPayload = (value: unknown): value is UsdtPayQrPayload => {
    if (!value || typeof value !== "object") return false;
    const row = value as UsdtPayQrPayload;
    return row.v === 1 && row.type === "usdt-pay" && typeof row.addresses === "object";
};

export const buildMultiNetworkUsdtQrPayload = (input: {
    addresses: Partial<Record<UsdtNetwork, string>>;
    amount?: number | null;
    businessName?: string;
    defaultNetwork?: UsdtNetwork;
}): string => {
    const segments: string[] = [];
    if (input.amount != null && input.amount > 0) {
        segments.push(formatQrAmount(input.amount));
    }

    const defaultNetwork = input.defaultNetwork ?? DEFAULT_USDT_NETWORK;
    if (input.addresses[defaultNetwork]?.trim()) {
        segments.push(`dn=${defaultNetwork}`);
    }

    for (const network of USDT_NETWORKS) {
        const address = input.addresses[network]?.trim();
        if (address) segments.push(`${network}=${address}`);
    }

    if (input.businessName?.trim()) {
        segments.push(`bn=${input.businessName.trim()}`);
    }

    return `usdtpay:${segments.join(";")}`;
};

export const parseUsdtPayQrPayload = (raw: string): UsdtPayQrPayload | null => {
    const trimmed = raw.trim();

    const compact = parseCompactUsdtPayQrPayload(trimmed);
    if (compact) return compact;

    if (!trimmed.startsWith("{")) return null;
    try {
        const parsed = JSON.parse(trimmed) as unknown;
        return isUsdtPayQrPayload(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

export const pickSendNetworkFromQrPayload = (
    payload: UsdtPayQrPayload,
    balances?: Record<string, number | null | undefined>
): UsdtNetwork => {
    const preferred = payload.defaultNetwork ?? DEFAULT_USDT_NETWORK;
    if (payload.addresses[preferred]) return preferred;

    if (balances) {
        for (const network of USDT_NETWORKS) {
            const value = balances[network];
            if (value != null && value > 0 && payload.addresses[network]) {
                return network;
            }
        }
    }

    for (const network of USDT_NETWORKS) {
        if (payload.addresses[network]) return network;
    }

    return DEFAULT_USDT_NETWORK;
};

export const resolveAddressFromQrPayload = (
    payload: UsdtPayQrPayload,
    network: UsdtNetwork
): string | null => {
    return payload.addresses[network]?.trim() || null;
};
