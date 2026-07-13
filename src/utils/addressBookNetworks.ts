import { DEFAULT_USDT_NETWORK, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import type { AddressBookEntry } from "../services/addressBookStorage";

export const getAddressBookEntryAddress = (
    entry: AddressBookEntry,
    network: UsdtNetwork
): string | null => {
    const fromMap = entry.addresses?.[network]?.trim();
    if (fromMap) return fromMap;
    if (entry.network === network) return entry.address.trim() || null;
    return null;
};

export const entrySupportsNetwork = (entry: AddressBookEntry, network: UsdtNetwork): boolean =>
    Boolean(getAddressBookEntryAddress(entry, network));

export const listAddressBookNetworks = (entry: AddressBookEntry): UsdtNetwork[] =>
    USDT_NETWORKS.filter((network) => entrySupportsNetwork(entry, network));

export const normalizeAddressBookAddresses = (
    input: Partial<Record<UsdtNetwork, string>> | undefined,
    fallbackNetwork: UsdtNetwork,
    fallbackAddress: string
): Partial<Record<UsdtNetwork, string>> => {
    const map: Partial<Record<UsdtNetwork, string>> = {};
    for (const network of USDT_NETWORKS) {
        const value = input?.[network]?.trim();
        if (value) map[network] = value;
    }
    if (!Object.keys(map).length && fallbackAddress.trim()) {
        map[fallbackNetwork] = fallbackAddress.trim();
    }
    return map;
};

export const pickDefaultAddressBookNetwork = (
    addresses: Partial<Record<UsdtNetwork, string>>
): UsdtNetwork => {
    for (const network of USDT_NETWORKS) {
        if (addresses[network]?.trim()) return network;
    }
    return DEFAULT_USDT_NETWORK;
};

export const trimAddressBookInputs = (
    inputs: Partial<Record<UsdtNetwork, string>> | undefined
): Partial<Record<UsdtNetwork, string>> => {
    const map: Partial<Record<UsdtNetwork, string>> = {};
    for (const network of USDT_NETWORKS) {
        const value = inputs?.[network]?.trim();
        if (value) map[network] = value;
    }
    return map;
};
