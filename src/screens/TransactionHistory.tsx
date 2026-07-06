import { Text, TouchableOpacity, ScrollView, View, StyleSheet, Platform } from "react-native";
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { components } from "../components";
import LoadingSpinner from "../components/LoadingSpinner";
import WalletDepositListItem from "../components/WalletDepositListItem";
import { api, PaymentRequest, WalletTransfer, invalidateCachedGet } from "../services/api";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { filterTransfersForActiveWallet, filterTransfersForDisplay } from "../utils/walletBalance";
import { resolveWalletAddressesForFilter, syncDeviceWalletInBackground } from "../services/wallet/syncDeviceWallet";
import { createMerchantTabPageStyles } from "../styles/merchantTabPageChrome";

type HistoryRow =
    | { kind: "payment"; key: string; sortAt: number; payment: PaymentRequest }
    | { kind: "deposit"; key: string; sortAt: number; deposit: WalletTransfer };

const TransactionHistory: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const { t } = useTranslation();
    const { colors, FONTS, isDark } = useTheme();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [deposits, setDeposits] = useState<WalletTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoadedRef = useRef(false);
    const [filter, setFilter] = useState("");

    const filters = [
        { label: t.payment.filterAll, value: "" },
        { label: t.payment.filterReceived, value: "DEPOSIT" },
        { label: t.payment.filterSent, value: "SEND" },
        { label: t.payment.filterPending, value: "PENDING" },
        { label: t.payment.filterPaid, value: "PAID" },
        { label: t.payment.filterExpired, value: "EXPIRED" },
        { label: t.payment.filterFailed, value: "FAILED" },
        { label: t.payment.filterCancelled, value: "CANCELLED" },
    ];

    // Header uses borderBottomRadius 24 — overlay extends under those curves to fill gaps.
    const pageStyles = useMemo(
        () =>
            StyleSheet.create({
                ...createMerchantTabPageStyles(colors),
                // Covers list region + the two corner gaps under the header curve.
                loadingOverlay: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(14, 14, 19, 0.55)" : "rgba(15, 23, 42, 0.28)",
                    zIndex: 20,
                    ...(Platform.OS === "web"
                        ? ({
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                          } as object)
                        : {}),
                },
                emptyContent: {
                    flex: 1,
                    justifyContent: "center",
                    paddingTop: 0,
                    paddingBottom: embedded ? 24 : 24,
                },
                emptyWrap: {
                    alignItems: "center",
                    paddingHorizontal: 24,
                },
                emptyTitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 20,
                },
                emptyLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue,
                    textDecorationLine: "underline",
                },
            }),
        [FONTS, colors, embedded, isDark]
    );

    const load = useCallback((opts?: { force?: boolean }) => {
        const silent = hasLoadedRef.current;
        if (!silent) setLoading(true);

        void (async () => {
            try {
                syncDeviceWalletInBackground();
                if (opts?.force) {
                    invalidateCachedGet("/merchant/wallets/transfers");
                    if (
                        filter === "" ||
                        filter === "PENDING" ||
                        filter === "PAID" ||
                        filter === "EXPIRED" ||
                        filter === "FAILED" ||
                        filter === "CANCELLED"
                    ) {
                        invalidateCachedGet("/payments/requests");
                    }
                }
                const activeAddresses = await resolveWalletAddressesForFilter();

                const needsTransfers =
                    filter === "" || filter === "DEPOSIT" || filter === "SEND";
                const transfersPromise = needsTransfers ? api.getWalletTransfers() : null;

                if (filter === "DEPOSIT" || filter === "SEND") {
                    const res = await transfersPromise!;
                    const type = filter === "DEPOSIT" ? "DEPOSIT" : "SEND";
                    const transfers = filterTransfersForDisplay(
                        filterTransfersForActiveWallet(
                            res.data.transfers.filter((row) => row.type === type),
                            activeAddresses
                        )
                    );
                    setPayments([]);
                    setDeposits(transfers);
                    return;
                }

                const paymentsPromise =
                    filter === ""
                        ? api.listPayments({ limit: 50 })
                        : api.listPayments({ status: filter, limit: 50 });

                if (filter === "") {
                    const [paymentsResult, transfersResult] = await Promise.allSettled([
                        paymentsPromise,
                        transfersPromise!,
                    ]);
                    setPayments(
                        paymentsResult.status === "fulfilled" ? paymentsResult.value.data.items : []
                    );
                    const transfersRaw =
                        transfersResult.status === "fulfilled"
                            ? transfersResult.value.data.transfers
                            : [];
                    setDeposits(
                        filterTransfersForDisplay(
                            filterTransfersForActiveWallet(transfersRaw, activeAddresses)
                        )
                    );
                    return;
                }

                const res = await paymentsPromise;
                setPayments(res.data.items);
                setDeposits([]);
            } catch {
                if (!hasLoadedRef.current) {
                    setPayments([]);
                    setDeposits([]);
                }
            } finally {
                hasLoadedRef.current = true;
                setLoading(false);
            }
        })();
    }, [filter]);

    const prevFilterRef = useRef(filter);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    useEffect(() => {
        if (prevFilterRef.current === filter) return;
        prevFilterRef.current = filter;
        if (hasLoadedRef.current) load();
    }, [filter, load]);

    const rows = useMemo((): HistoryRow[] => {
        const byTime = (a: HistoryRow, b: HistoryRow) => b.sortAt - a.sortAt;

        const paymentRows: HistoryRow[] = payments.map((payment) => ({
            kind: "payment",
            key: `payment:${payment.id}`,
            sortAt: new Date(payment.paidAt || payment.createdAt).getTime(),
            payment,
        }));

        const depositRows: HistoryRow[] = deposits.map((deposit) => ({
            kind: "deposit",
            key: deposit.id,
            sortAt: new Date(deposit.timestamp).getTime(),
            deposit,
        }));

        if (filter === "DEPOSIT") {
            return depositRows
                .filter((row) => row.deposit?.type === "DEPOSIT")
                .sort(byTime);
        }
        if (filter === "SEND") {
            return depositRows
                .filter((row) => row.deposit?.type === "SEND")
                .sort(byTime);
        }
        if (filter === "") {
            return [...paymentRows, ...depositRows].sort(byTime);
        }
        return paymentRows
            .filter((row) => row.payment?.status === filter)
            .sort(byTime);
    }, [payments, deposits, filter]);

    const isEmptyFilter = filter === "";
    const emptyMessage = isEmptyFilter
        ? t.payment.noHistoryAny
        : filter === "DEPOSIT"
          ? t.payment.noDeposits
          : filter === "SEND"
            ? t.payment.noSends
            : t.payment.noHistory;
    const emptyActionLabel = isEmptyFilter ? t.dashboard.createPayment : t.payment.showAllHistory;
    const onEmptyAction = useCallback(() => {
        if (isEmptyFilter) {
            const parent = navigation.getParent();
            if (parent) {
                parent.navigate("Dashboard", { screen: "CreateInvoice" });
            } else {
                navigation.navigate("CreateInvoice");
            }
            return;
        }
        setFilter("");
    }, [isEmptyFilter, navigation]);

    const filterChips = (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
            {filters.map((f) => (
                <TouchableOpacity
                    key={f.value || "all"}
                    onPress={() => setFilter(f.value)}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginRight: 8,
                        backgroundColor: filter === f.value ? colors.white : "rgba(255,255,255,0.14)",
                    }}
                >
                    <Text
                        style={{
                            color: filter === f.value ? colors.mainDark : colors.white,
                            fontSize: 13,
                            ...FONTS.Mulish_600SemiBold,
                        }}
                    >
                        {f.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const showEmptyState = !loading && rows.length === 0;

    const listBody = (
        <components.MerchantContent
            style={
                showEmptyState
                    ? pageStyles.emptyContent
                    : { paddingTop: 16, paddingBottom: embedded ? 0 : 24 }
            }
        >
            {showEmptyState ? (
                <View style={pageStyles.emptyWrap}>
                    <Text style={pageStyles.emptyTitle}>{emptyMessage}</Text>
                    <TouchableOpacity onPress={onEmptyAction} accessibilityRole="link">
                        <Text style={pageStyles.emptyLink}>{emptyActionLabel}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                rows.map((row) =>
                    row.kind === "payment" ? (
                        <components.PaymentListItem
                            key={row.key}
                            item={row.payment}
                            showDate
                            onPress={() =>
                                navigation.navigate("TransactionDetails", {
                                    payment: row.payment,
                                    paymentId: row.payment.id,
                                })
                            }
                        />
                    ) : (
                        <WalletDepositListItem
                            key={row.key}
                            item={row.deposit}
                            showDate
                            onPress={() =>
                                navigation.navigate("WalletDepositDetails", { deposit: row.deposit })
                            }
                        />
                    )
                )
            )}
        </components.MerchantContent>
    );

    if (embedded) {
        return (
            <View style={pageStyles.root}>
                <View style={pageStyles.headerWrap}>
                    <components.MerchantTabHeader
                        eyebrow={merchant?.businessName || t.common.merchant}
                        title={t.payment.historyTitle}
                        subtitle={t.payment.historySubtitle}
                    >
                        {filterChips}
                    </components.MerchantTabHeader>
                </View>
                <View style={pageStyles.contentArea}>
                    <components.ScreenScroll
                        contentStyle={showEmptyState ? { flex: 1 } : undefined}
                    >
                        {listBody}
                    </components.ScreenScroll>
                    {loading && !hasLoadedRef.current ? (
                        <View style={pageStyles.loadingOverlay} pointerEvents="auto">
                            <LoadingSpinner size={48} />
                        </View>
                    ) : null}
                </View>
            </View>
        );
    }

    return (
        <View style={pageStyles.root}>
            <components.Header title={t.payment.historyTitle} goBack={true} />
            <View style={pageStyles.contentArea}>
                <components.ScreenScroll
                    withTabBarInset={false}
                    contentStyle={showEmptyState ? { flex: 1 } : undefined}
                >
                    <components.MerchantContent style={{ paddingTop: 8 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginBottom: 16 }}
                        >
                            {filters.map((f) => (
                                <TouchableOpacity
                                    key={f.value || "all"}
                                    onPress={() => setFilter(f.value)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        marginRight: 8,
                                        backgroundColor:
                                            filter === f.value ? colors.mainDark : colors.white,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color:
                                                filter === f.value ? colors.white : colors.mainDark,
                                            fontSize: 13,
                                        }}
                                    >
                                        {f.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </components.MerchantContent>
                    {listBody}
                </components.ScreenScroll>
                {loading && !hasLoadedRef.current ? (
                    <View style={pageStyles.loadingOverlay} pointerEvents="auto">
                        <LoadingSpinner size={48} />
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export default TransactionHistory;
