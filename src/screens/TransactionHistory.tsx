import { Text, TouchableOpacity, ScrollView, View, StyleSheet, Platform } from "react-native";
import React, { useState, useCallback, useMemo } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { components } from "../components";
import LoadingSpinner from "../components/LoadingSpinner";
import WalletDepositListItem from "../components/WalletDepositListItem";
import { api, PaymentRequest, WalletTransfer } from "../services/api";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";

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
    const [filter, setFilter] = useState("");

    const filters = [
        { label: t.payment.filterAll, value: "" },
        { label: t.payment.filterReceived, value: "DEPOSIT" },
        { label: t.payment.filterPending, value: "PENDING" },
        { label: t.payment.filterPaid, value: "PAID" },
        { label: t.payment.filterExpired, value: "EXPIRED" },
        { label: t.payment.filterFailed, value: "FAILED" },
        { label: t.payment.filterCancelled, value: "CANCELLED" },
    ];

    // Header uses borderBottomRadius 24 — overlay extends under those curves to fill gaps.
    const headerCurve = 24;

    const pageStyles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                headerWrap: {
                    zIndex: 30,
                    elevation: 30,
                },
                contentArea: {
                    flex: 1,
                    minHeight: 0,
                    position: "relative",
                    overflow: "hidden",
                    // Sit under the header’s rounded bottom corners.
                    marginTop: -headerCurve,
                    paddingTop: headerCurve,
                    ...(Platform.OS === "web"
                        ? ({ height: "100%", display: "flex" } as object)
                        : {}),
                },
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
            }),
        [colors.bgColor, isDark]
    );

    const load = useCallback(() => {
        setLoading(true);

        if (filter === "DEPOSIT") {
            api.getWalletTransfers()
                .then((res) => {
                    setPayments([]);
                    setDeposits(res.data.transfers.filter((row) => row.type === "DEPOSIT"));
                })
                .catch(() => {
                    setPayments([]);
                    setDeposits([]);
                })
                .finally(() => setLoading(false));
            return;
        }

        const paymentsPromise =
            filter === ""
                ? api.listPayments({ limit: 50 })
                : api.listPayments({ status: filter, limit: 50 });

        if (filter === "") {
            Promise.allSettled([paymentsPromise, api.getWalletTransfers()])
                .then(([paymentsResult, transfersResult]) => {
                    setPayments(
                        paymentsResult.status === "fulfilled" ? paymentsResult.value.data.items : []
                    );
                    setDeposits(
                        transfersResult.status === "fulfilled" ? transfersResult.value.data.transfers : []
                    );
                })
                .finally(() => setLoading(false));
            return;
        }

        paymentsPromise
            .then((res) => {
                setPayments(res.data.items);
                setDeposits([]);
            })
            .catch(() => {
                setPayments([]);
                setDeposits([]);
            })
            .finally(() => setLoading(false));
    }, [filter]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const rows = useMemo((): HistoryRow[] => {
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

        return [...paymentRows, ...depositRows].sort((a, b) => b.sortAt - a.sortAt);
    }, [payments, deposits]);

    const emptyMessage =
        filter === "DEPOSIT" ? t.payment.noDeposits : filter === "" ? t.payment.noHistoryAny : t.payment.noHistory;

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

    const listBody = (
        <components.MerchantContent style={{ paddingTop: 16, paddingBottom: embedded ? 0 : 24 }}>
            {!loading && rows.length === 0 ? (
                <View
                    style={{
                        backgroundColor: colors.white,
                        borderRadius: 14,
                        paddingVertical: 32,
                        paddingHorizontal: 20,
                        alignItems: "center",
                        shadowColor: "#062664",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 3,
                    }}
                >
                    <Text style={{ textAlign: "center", color: colors.bodyTextColor, fontSize: 14 }}>
                        {emptyMessage}
                    </Text>
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
                    <components.ScreenScroll>{listBody}</components.ScreenScroll>
                    {loading ? (
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
                <components.ScreenScroll withTabBarInset={false}>
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
                {loading ? (
                    <View style={pageStyles.loadingOverlay} pointerEvents="auto">
                        <LoadingSpinner size={48} />
                    </View>
                ) : null}
            </View>
        </View>
    );
};

export default TransactionHistory;
