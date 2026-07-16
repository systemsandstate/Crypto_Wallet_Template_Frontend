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
import { filterPaymentsForActivityFeed } from "../utils/walletActivityFeed";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { createMerchantTabPageStyles } from "../styles/merchantTabPageChrome";
import { useCounterpartyLabelsForTransfers } from "../hooks/useCounterpartyLabelsForTransfers";

type HistoryRow =
    | { kind: "payment"; key: string; sortAt: number; payment: PaymentRequest }
    | { kind: "deposit"; key: string; sortAt: number; deposit: WalletTransfer };

const PAGE_SIZE = 20;

const TransactionHistory: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [paymentsTotal, setPaymentsTotal] = useState(0);
    const [deposits, setDeposits] = useState<WalletTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const hasLoadedRef = useRef(false);
    const loadInFlightRef = useRef(false);
    const [filter, setFilter] = useState("");

    const getCounterpartyLabel = useCounterpartyLabelsForTransfers(deposits);

    // Paid overlapped Received; Expired/Cancelled are not useful for the cashier flow.
    const filters = useMemo(
        () => [
            { label: t.payment.filterAll, value: "" },
            { label: t.payment.filterReceived, value: "DEPOSIT" },
            { label: t.payment.filterSent, value: "SEND" },
            { label: t.payment.filterFailed, value: "FAILED" },
        ],
        [t]
    );

    const pageStyles = useMemo(
        () =>
            StyleSheet.create({
                ...createMerchantTabPageStyles(colors),
                loadingOverlay: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.overlay,
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
                    paddingBottom: 24,
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
                loadMoreWrap: {
                    paddingTop: 8,
                    paddingBottom: 8,
                },
            }),
        [FONTS, colors]
    );

    const usesPaymentRequests = filter === "" || filter === "FAILED";

    const load = useCallback(
        (opts?: { force?: boolean }) => {
            if (loadInFlightRef.current) return;
            loadInFlightRef.current = true;

            const silent = hasLoadedRef.current;
            if (!silent) setLoading(true);

            void (async () => {
                try {
                    if (opts?.force) {
                        invalidateCachedGet("/merchant/wallets/transfers");
                        if (usesPaymentRequests) {
                            invalidateCachedGet("/payments/requests");
                        }
                    }

                    const activeAddresses = await prepareWalletContext();
                    setVisibleCount(PAGE_SIZE);

                    if (filter === "DEPOSIT" || filter === "SEND") {
                        const res = await api.getWalletTransfers();
                        const type = filter === "DEPOSIT" ? "DEPOSIT" : "SEND";
                        const transfers = filterTransfersForDisplay(
                            filterTransfersForActiveWallet(
                                (res.data.transfers ?? []).filter((row) => row.type === type),
                                activeAddresses
                            )
                        );
                        setPayments([]);
                        setPaymentsTotal(0);
                        setDeposits(transfers);
                        return;
                    }

                    if (filter === "FAILED") {
                        const res = await api.listPayments({
                            status: filter,
                            limit: PAGE_SIZE,
                            offset: 0,
                        });
                        setPayments(res.data.items ?? []);
                        setPaymentsTotal(res.data.total ?? 0);
                        setDeposits([]);
                        return;
                    }

                    // All
                    const [paymentsResult, transfersResult] = await Promise.allSettled([
                        api.listPayments({ limit: PAGE_SIZE, offset: 0 }),
                        api.getWalletTransfers(),
                    ]);
                    if (paymentsResult.status === "fulfilled") {
                        setPayments(paymentsResult.value.data.items ?? []);
                        setPaymentsTotal(paymentsResult.value.data.total ?? 0);
                    } else {
                        setPayments([]);
                        setPaymentsTotal(0);
                    }
                    const transfersRaw =
                        transfersResult.status === "fulfilled"
                            ? transfersResult.value.data.transfers ?? []
                            : [];
                    setDeposits(
                        filterTransfersForDisplay(
                            filterTransfersForActiveWallet(transfersRaw, activeAddresses)
                        )
                    );
                } catch {
                    if (!hasLoadedRef.current) {
                        setPayments([]);
                        setPaymentsTotal(0);
                        setDeposits([]);
                    }
                } finally {
                    hasLoadedRef.current = true;
                    loadInFlightRef.current = false;
                    setLoading(false);
                }
            })();
        },
        [filter, usesPaymentRequests]
    );

    const prevFilterRef = useRef(filter);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedRef.current) {
                load();
            }
        }, [load])
    );

    useEffect(() => {
        if (prevFilterRef.current === filter) return;
        prevFilterRef.current = filter;
        if (hasLoadedRef.current) load({ force: true });
    }, [filter, load]);

    const rows = useMemo((): HistoryRow[] => {
        const byTime = (a: HistoryRow, b: HistoryRow) => b.sortAt - a.sortAt;

        const visiblePayments =
            filter === "" ? filterPaymentsForActivityFeed(payments, deposits) : payments;

        const paymentRows: HistoryRow[] = visiblePayments.map((payment) => ({
            kind: "payment",
            key: `payment:${payment.id}`,
            sortAt: new Date(payment.paidAt || payment.createdAt).getTime(),
            payment,
        }));

        const depositRows: Extract<HistoryRow, { kind: "deposit" }>[] = deposits.map((deposit) => ({
            kind: "deposit",
            key: deposit.id,
            sortAt: new Date(deposit.timestamp).getTime(),
            deposit,
        }));

        if (filter === "DEPOSIT") {
            return depositRows.filter((row) => row.deposit.type === "DEPOSIT").sort(byTime);
        }
        if (filter === "SEND") {
            return depositRows.filter((row) => row.deposit.type === "SEND").sort(byTime);
        }
        if (filter === "") {
            return [...paymentRows, ...depositRows].sort(byTime);
        }
        return paymentRows.filter((row) => row.payment.status === filter).sort(byTime);
    }, [payments, deposits, filter]);

    const displayedRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

    const hasMoreLocal = rows.length > visibleCount;
    const hasMorePayments = usesPaymentRequests && payments.length < paymentsTotal;
    const canLoadMore = hasMoreLocal || hasMorePayments;

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || loadInFlightRef.current) return;

        if (hasMoreLocal) {
            setVisibleCount((count) => count + PAGE_SIZE);
            return;
        }

        if (!hasMorePayments) return;

        setLoadingMore(true);
        try {
            const status = filter === "FAILED" ? filter : undefined;
            const res = await api.listPayments({
                status,
                limit: PAGE_SIZE,
                offset: payments.length,
            });
            const nextItems = res.data.items ?? [];
            setPayments((prev) => {
                const seen = new Set(prev.map((item) => item.id));
                return [...prev, ...nextItems.filter((item) => !seen.has(item.id))];
            });
            setPaymentsTotal(res.data.total ?? paymentsTotal);
            setVisibleCount((count) => count + PAGE_SIZE);
        } catch {
            // Keep current page if the next page fails.
        } finally {
            setLoadingMore(false);
        }
    }, [filter, hasMoreLocal, hasMorePayments, loadingMore, payments.length, paymentsTotal]);

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
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginRight: 8,
                        backgroundColor: filter === f.value ? colors.accentBlue : colors.surfaceMuted,
                        borderWidth: 1,
                        borderColor: filter === f.value ? colors.accentBlue : colors.border,
                    }}
                >
                    <Text
                        style={{
                            color: filter === f.value ? colors.pureWhite : colors.bodyTextColor,
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
                <>
                    {displayedRows.map((row) =>
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
                                counterparty={getCounterpartyLabel(row.deposit)}
                                onPress={() =>
                                    navigation.navigate("WalletDepositDetails", { deposit: row.deposit })
                                }
                            />
                        )
                    )}
                    {canLoadMore ? (
                        <View style={pageStyles.loadMoreWrap}>
                            <components.Button
                                title={t.payment.loadMore}
                                onPress={() => void handleLoadMore()}
                                loading={loadingMore}
                                disabled={loadingMore}
                                size="compact"
                                variant="secondary"
                            />
                        </View>
                    ) : null}
                </>
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
