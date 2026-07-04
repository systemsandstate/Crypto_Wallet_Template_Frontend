import AsyncStorage from "@react-native-async-storage/async-storage";

import type { UsdtNetwork } from "../constants/usdtNetworks";

export type AddressBookEntry = {
    id: string;
    name: string;
    address: string;
    network: UsdtNetwork;
    createdAt: string;
};

const storageKey = (merchantId: string) => `addressBook:${merchantId}`;

export async function loadAddressBook(merchantId: string): Promise<AddressBookEntry[]> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(merchantId));
        if (!raw) return [];
        const parsed = JSON.parse(raw) as AddressBookEntry[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function saveAddressBook(merchantId: string, entries: AddressBookEntry[]): Promise<void> {
    await AsyncStorage.setItem(storageKey(merchantId), JSON.stringify(entries));
}

export async function addAddressBookEntry(
    merchantId: string,
    entry: Omit<AddressBookEntry, "id" | "createdAt">
): Promise<AddressBookEntry[]> {
    const existing = await loadAddressBook(merchantId);
    const next: AddressBookEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
    };
    const updated = [next, ...existing];
    await saveAddressBook(merchantId, updated);
    return updated;
}

export async function removeAddressBookEntry(merchantId: string, id: string): Promise<AddressBookEntry[]> {
    return removeAddressBookEntries(merchantId, [id]);
}

export async function removeAddressBookEntries(
    merchantId: string,
    ids: string[]
): Promise<AddressBookEntry[]> {
    if (ids.length === 0) return loadAddressBook(merchantId);
    const idSet = new Set(ids);
    const existing = await loadAddressBook(merchantId);
    const updated = existing.filter((entry) => !idSet.has(entry.id));
    await saveAddressBook(merchantId, updated);
    return updated;
}

export async function updateAddressBookEntriesBatch(
    merchantId: string,
    ids: string[],
    updates: Partial<Pick<AddressBookEntry, "name" | "address" | "network">>
): Promise<AddressBookEntry[]> {
    if (ids.length === 0) return loadAddressBook(merchantId);
    const idSet = new Set(ids);
    const existing = await loadAddressBook(merchantId);
    const updated = existing.map((entry) =>
        idSet.has(entry.id)
            ? {
                  ...entry,
                  ...updates,
                  name: updates.name?.trim() ?? entry.name,
                  address: updates.address?.trim() ?? entry.address,
              }
            : entry
    );
    await saveAddressBook(merchantId, updated);
    return updated;
}

export async function updateAddressBookEntry(
    merchantId: string,
    id: string,
    updates: Partial<Pick<AddressBookEntry, "name" | "address" | "network">>
): Promise<AddressBookEntry[]> {
    const existing = await loadAddressBook(merchantId);
    const updated = existing.map((entry) =>
        entry.id === id
            ? {
                  ...entry,
                  ...updates,
                  name: updates.name?.trim() ?? entry.name,
                  address: updates.address?.trim() ?? entry.address,
              }
            : entry
    );
    await saveAddressBook(merchantId, updated);
    return updated;
}
