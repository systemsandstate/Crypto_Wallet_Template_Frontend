export const USDT_NETWORKS = ['TRC20', 'ERC20', 'BEP20'] as const;

export type UsdtNetwork = (typeof USDT_NETWORKS)[number];

/** Default network for payment requests and receive flows. */
export const DEFAULT_USDT_NETWORK: UsdtNetwork = 'BEP20';

export type ReceiveAsset = 'USDT' | 'NATIVE';

export const NATIVE_SYMBOLS: Record<UsdtNetwork, string> = {
    TRC20: 'TRX',
    ERC20: 'ETH',
    BEP20: 'BNB',
};

export const NETWORK_LABELS: Record<UsdtNetwork, string> = {
    TRC20: 'TRON',
    ERC20: 'Ethereum',
    BEP20: 'BNB Chain',
};

export const NETWORK_SHORT: Record<UsdtNetwork, string> = {
    TRC20: 'TRC20',
    ERC20: 'ERC20',
    BEP20: 'BEP20',
};

export const NETWORK_CMC_IDS: Record<UsdtNetwork, number> = {
    TRC20: 1958,
    ERC20: 1027,
    BEP20: 1839,
};

export const formatUsdtNetwork = (network: string) => {
    if ((USDT_NETWORKS as readonly string[]).includes(network)) {
        return `USDT (${NETWORK_SHORT[network as UsdtNetwork]})`;
    }
    return `USDT (${network})`;
};
