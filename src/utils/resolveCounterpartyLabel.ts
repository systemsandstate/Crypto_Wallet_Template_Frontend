import { api } from "../services/api";
import type { AddressBookEntry } from "../services/addressBookStorage";
import type { UsdtNetwork } from "../constants/usdtNetworks";
import { findAddressBookEntry } from "./addressBookMatch";

export type CounterpartyKind = "app" | "contact" | "external" | "self" | "unknown";

export type CounterpartyLabel = {
    name: string;
    kind: CounterpartyKind;
};

export type CounterpartyLabelStrings = {
    appUser: string;
    contact: string;
    external: string;
    unknown: string;
    self: string;
};

const lookupCache = new Map<string, CounterpartyLabel>();

export function counterpartyCacheKey(network: string, address: string): string {
    const normalized = network === "TRC20" ? address.trim() : address.trim().toLowerCase();
    return `${network}:${normalized}`;
}

export function formatShortTransactionId(txHash: string): string {
    const trimmed = txHash.trim();
    if (trimmed.length <= 16) return trimmed;
    return `${trimmed.slice(0, 8)}…${trimmed.slice(-6)}`;
}

export async function resolveCounterpartyLabel(
    address: string | undefined | null,
    network: UsdtNetwork,
    addressBook: AddressBookEntry[],
    labels: CounterpartyLabelStrings
): Promise<CounterpartyLabel | null> {
    const trimmed = address?.trim();
    if (!trimmed) return null;

    const key = counterpartyCacheKey(network, trimmed);
    const cached = lookupCache.get(key);
    if (cached) return cached;

    const contact = findAddressBookEntry(addressBook, trimmed, network);
    if (contact?.name) {
        const result: CounterpartyLabel = { name: contact.name, kind: "contact" };
        lookupCache.set(key, result);
        return result;
    }

    try {
        const res = await api.lookupWalletRecipient({ address: trimmed, network });
        const data = res.data;
        if (data.found && data.isSelf) {
            const result: CounterpartyLabel = { name: labels.self, kind: "self" };
            lookupCache.set(key, result);
            return result;
        }
        if (data.found && data.businessName) {
            const result: CounterpartyLabel = { name: data.businessName, kind: "app" };
            lookupCache.set(key, result);
            return result;
        }
    } catch {
        // fall through to external label
    }

    const result: CounterpartyLabel = { name: labels.external, kind: "external" };
    lookupCache.set(key, result);
    return result;
}
