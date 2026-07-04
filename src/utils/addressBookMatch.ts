import type { UsdtNetwork } from "../constants/usdtNetworks";
import type { AddressBookEntry } from "../services/addressBookStorage";

export const normalizeAddressForMatch = (network: UsdtNetwork, address: string): string => {
    if (network === "TRC20" || network === "SOL") return address;
    return address.toLowerCase();
};

export const findAddressBookEntry = (
    entries: AddressBookEntry[],
    address: string,
    network: UsdtNetwork
): AddressBookEntry | undefined => {
    const target = normalizeAddressForMatch(network, address);
    return entries.find(
        (entry) =>
            entry.network === network &&
            normalizeAddressForMatch(entry.network, entry.address) === target
    );
};
