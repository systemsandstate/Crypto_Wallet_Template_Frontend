import type { UsdtNetwork } from "../constants/usdtNetworks";
import type { AddressBookEntry } from "../services/addressBookStorage";
import { getAddressBookEntryAddress } from "./addressBookNetworks";

export const normalizeAddressForMatch = (network: UsdtNetwork, address: string): string => {
    if (network === "TRC20") return address;
    return address.toLowerCase();
};

export const findAddressBookEntry = (
    entries: AddressBookEntry[],
    address: string,
    network: UsdtNetwork
): AddressBookEntry | undefined => {
    const target = normalizeAddressForMatch(network, address);
    return entries.find((entry) => {
        const candidate = getAddressBookEntryAddress(entry, network);
        if (!candidate) return false;
        return normalizeAddressForMatch(network, candidate) === target;
    });
};
