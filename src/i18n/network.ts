import type { UsdtNetwork } from "../constants/usdtNetworks";
import type { TranslationDict } from "./types";

export function getLocalizedNetworkLabel(network: UsdtNetwork, t: TranslationDict): string {
    const labels: Record<UsdtNetwork, string> = {
        TRC20: t.network.tron,
        ERC20: t.network.ethereum,
        BEP20: t.network.bnbChain,
        SOL: t.network.solana,
        POLYGON: t.network.polygon,
    };
    return labels[network];
}
