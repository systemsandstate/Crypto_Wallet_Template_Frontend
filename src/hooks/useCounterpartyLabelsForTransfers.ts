import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "./useAppSelector";
import { useTranslation } from "./useTranslation";
import { loadAddressBook, type AddressBookEntry } from "../services/addressBookStorage";
import type { WalletTransfer } from "../services/api";
import type { UsdtNetwork } from "../constants/usdtNetworks";
import {
    counterpartyCacheKey,
    resolveCounterpartyLabel,
    type CounterpartyLabel,
} from "../utils/resolveCounterpartyLabel";

export function useCounterpartyLabelsForTransfers(transfers: WalletTransfer[] | null | undefined) {
    const merchantId = useAppSelector((state) => state.auth.merchant?.id);
    const { t } = useTranslation();
    const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
    const [labels, setLabels] = useState<Record<string, CounterpartyLabel>>({});

    useEffect(() => {
        if (!merchantId) {
            setAddressBook([]);
            return;
        }
        let cancelled = false;
        void loadAddressBook(merchantId).then((entries) => {
            if (!cancelled) setAddressBook(entries);
        });
        return () => {
            cancelled = true;
        };
    }, [merchantId]);

    useEffect(() => {
        let cancelled = false;
        const labelStrings = {
            appUser: t.withdraw.recipientAppUser,
            contact: t.withdraw.recipientContact,
            external: t.withdraw.recipientExternal,
            unknown: t.transaction.counterpartyUnknown,
            self: t.transaction.yourAccount,
        };

        const unique = new Map<string, { address: string; network: UsdtNetwork }>();
        for (const transfer of transfers ?? []) {
            const address = transfer.type === "SEND" ? transfer.toAddress : transfer.fromAddress;
            if (!address?.trim()) continue;
            const network = transfer.network as UsdtNetwork;
            unique.set(counterpartyCacheKey(network, address), { address, network });
        }

        if (unique.size === 0) {
            setLabels({});
            return;
        }

        void Promise.all(
            [...unique.entries()].map(async ([key, { address, network }]) => {
                const label = await resolveCounterpartyLabel(
                    address,
                    network,
                    addressBook,
                    labelStrings
                );
                return [key, label] as const;
            })
        ).then((entries) => {
            if (cancelled) return;
            const next: Record<string, CounterpartyLabel> = {};
            for (const [key, label] of entries) {
                if (label) next[key] = label;
            }
            setLabels(next);
        });

        return () => {
            cancelled = true;
        };
    }, [addressBook, transfers, t]);

    return useCallback(
        (transfer: WalletTransfer): CounterpartyLabel | null => {
            const address = transfer.type === "SEND" ? transfer.toAddress : transfer.fromAddress;
            if (!address?.trim()) return null;
            return labels[counterpartyCacheKey(transfer.network, address)] ?? null;
        },
        [labels]
    );
}
