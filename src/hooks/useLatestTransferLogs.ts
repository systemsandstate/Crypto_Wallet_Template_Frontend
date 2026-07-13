import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "./useAppSelector";
import { useTranslation } from "./useTranslation";
import { api, WalletTransfer } from "../services/api";
import { loadAddressBook, type AddressBookEntry } from "../services/addressBookStorage";
import type { UsdtNetwork } from "../constants/usdtNetworks";
import {
    counterpartyCacheKey,
    resolveCounterpartyLabel,
    type CounterpartyLabel,
} from "../utils/resolveCounterpartyLabel";

export type LatestTransferLog = {
    id: string;
    toAddress: string;
    network: UsdtNetwork;
    amount: number;
    timestamp: string;
    label: string;
    kind: CounterpartyLabel["kind"];
};

const MAX_LOGS = 5;

function pickLatestSendTransfers(transfers: WalletTransfer[] | null | undefined): WalletTransfer[] {
    if (!transfers?.length) return [];
    return transfers
        .filter((transfer) => transfer.type === "SEND" && transfer.currency === "USDT")
        .filter((transfer) => Boolean(transfer.toAddress?.trim()))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_LOGS);
}

export function useLatestTransferLogs(enabled = true) {
    const merchantId = useAppSelector((state) => state.auth.merchant?.id);
    const { t } = useTranslation();
    const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
    const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
    const [labels, setLabels] = useState<Record<string, CounterpartyLabel>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled || !merchantId) {
            setTransfers([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        void api
            .getWalletTransfers()
            .then((res) => {
                if (!cancelled) setTransfers(res.data.transfers ?? []);
            })
            .catch(() => {
                if (!cancelled) setTransfers([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [enabled, merchantId]);

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

    const candidates = useMemo(() => pickLatestSendTransfers(transfers), [transfers]);

    useEffect(() => {
        let cancelled = false;
        if (candidates.length === 0) {
            setLabels({});
            return;
        }

        const labelStrings = {
            appUser: t.withdraw.recipientAppUser,
            contact: t.withdraw.recipientContact,
            external: t.withdraw.recipientExternal,
            unknown: t.transaction.counterpartyUnknown,
            self: t.transaction.yourAccount,
        };

        void Promise.all(
            candidates.map(async (transfer) => {
                const toAddress = transfer.toAddress.trim();
                const network = transfer.network as UsdtNetwork;
                const key = `${transfer.id}:${counterpartyCacheKey(network, toAddress)}`;
                const label = await resolveCounterpartyLabel(
                    toAddress,
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
    }, [addressBook, candidates, t]);

    const logs = useMemo<LatestTransferLog[]>(() => {
        return candidates.map((transfer) => {
            const toAddress = transfer.toAddress.trim();
            const network = transfer.network as UsdtNetwork;
            const key = `${transfer.id}:${counterpartyCacheKey(network, toAddress)}`;
            const label = labels[key];
            return {
                id: transfer.id,
                toAddress,
                network,
                amount: Number(transfer.amount) || 0,
                timestamp: transfer.timestamp,
                label: label?.name ?? t.transaction.counterpartyUnknown,
                kind: label?.kind ?? "unknown",
            };
        });
    }, [candidates, labels, t.transaction.counterpartyUnknown]);

    const refresh = useCallback(async () => {
        if (!merchantId) return;
        try {
            const res = await api.getWalletTransfers();
            setTransfers(res.data.transfers ?? []);
        } catch {
            setTransfers([]);
        }
    }, [merchantId]);

    return { logs, loading, refresh };
}
