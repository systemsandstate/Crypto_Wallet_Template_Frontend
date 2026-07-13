import type { UsdtNetwork } from "../constants/usdtNetworks";
import { NETWORK_SHORT } from "../constants/usdtNetworks";
import type { TranslationDict } from "./types";

/** Short network code (TRC20, BEP20, ERC20) for screens where the merchant must pick the correct rail. */
export function getLocalizedNetworkLabel(network: UsdtNetwork, _t: TranslationDict): string {
    return NETWORK_SHORT[network];
}

export function getNetworkCodeLabel(network: UsdtNetwork): string {
    return NETWORK_SHORT[network];
}
