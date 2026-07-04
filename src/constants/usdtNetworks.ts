export const USDT_NETWORKS = ['TRC20', 'ERC20', 'BEP20', 'SOL', 'POLYGON'] as const;

export type UsdtNetwork = (typeof USDT_NETWORKS)[number];

export type ReceiveAsset = 'USDT' | 'NATIVE';

export const NATIVE_SYMBOLS: Record<UsdtNetwork, string> = {
    TRC20: 'TRX',
    ERC20: 'ETH',
    BEP20: 'BNB',
    SOL: 'SOL',
    POLYGON: 'POL',
};

export const NETWORK_LABELS: Record<UsdtNetwork, string> = {
    TRC20: 'TRON',
    ERC20: 'Ethereum',
    BEP20: 'BNB Chain',
    SOL: 'Solana',
    POLYGON: 'Polygon',
};

export const NETWORK_SHORT: Record<UsdtNetwork, string> = {
    TRC20: 'TRC20',
    ERC20: 'ERC20',
    BEP20: 'BEP20',
    SOL: 'SOL',
    POLYGON: 'POLYGON',
};

export const NETWORK_CMC_IDS: Record<UsdtNetwork, number> = {
    TRC20: 1958,
    ERC20: 1027,
    BEP20: 1839,
    SOL: 5426,
    POLYGON: 28321,
};

export const formatUsdtNetwork = (network: string) => {
    if ((USDT_NETWORKS as readonly string[]).includes(network)) {
        return `USDT (${NETWORK_SHORT[network as UsdtNetwork]})`;
    }
    return `USDT (${network})`;
};
