import React, { useCallback, useState } from "react";
import { View, Text } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { components } from "../components";
import { api, PaymentRequest, WalletTransfer } from "../services/api";
import { sumWalletBalances } from "../utils/walletBalance";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";

const sumAmounts = (items: PaymentRequest[]) =>
    items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);

const sumDepositAmounts = (items: WalletTransfer[]) =>
    items
        .filter((item) => item.type === "DEPOSIT")
        .reduce((total, item) => total + (Number(item.amount) || 0), 0);

const Analytics: React.FC = () => {
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        pending: 0,
        pendingAmount: 0,
        depositCount: 0,
        depositAmount: 0,
        walletBalance: 0,
    });

    const load = useCallback((isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        Promise.all([
            api.listPayments({ limit: 100 }),
            api.getWalletBalances().catch(() => ({ data: { balances: [] as Array<{ usdtBalance: number | null }> } })),
            api.getWalletTransfers().catch(() => ({ data: { transfers: [] as WalletTransfer[] } })),
        ])
            .then(([paymentsRes, balancesRes, transfersRes]) => {
                const items = paymentsRes.data.items;
                const pendingItems = items.filter((p) => p.status === "PENDING");
                const deposits = transfersRes.data.transfers;
                setStats({
                    pending: pendingItems.length,
                    pendingAmount: sumAmounts(pendingItems),
                    depositCount: deposits.length,
                    depositAmount: sumDepositAmounts(deposits),
                    walletBalance: sumWalletBalances(balancesRes.data.balances),
                });
            })
            .catch(() => {
                if (!isRefresh) {
                    setStats({
                        pending: 0,
                        pendingAmount: 0,
                        depositCount: 0,
                        depositAmount: 0,
                        walletBalance: 0,
                    });
                }
            })
            .finally(() => {
                if (isRefresh) {
                    setRefreshing(false);
                } else {
                    setLoading(false);
                }
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            load(false);
        }, [load])
    );

    const formatAmount = (value: number) =>
        value.toLocaleString(dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const statCard = (label: string, value: string) => (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 14,
                padding: 16,
                shadowColor: "#062664",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
            }}
        >
            <Text style={{ ...FONTS.Mulish_400Regular, fontSize: 13, color: colors.bodyTextColor, marginBottom: 8 }}>
                {label}
            </Text>
            <Text style={{ ...FONTS.Mulish_700Bold, fontSize: 22, color: colors.mainDark }}>{value}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <components.ScreenScroll>
                <components.MerchantTabHeader
                    eyebrow={merchant?.businessName || t.common.merchant}
                    title={t.analytics.title}
                    subtitle={t.analytics.subtitle}
                />
                <components.MerchantContent style={{ paddingTop: 16, paddingBottom: 24 }}>
                {loading ? (
                    <LoadingSpinner size={40} style={{ marginTop: 24 }} />
                ) : (
                    <>
                        <components.MerchantBalanceCard
                            businessName={merchant?.businessName || t.common.merchant}
                            walletBalance={stats.walletBalance}
                            pendingCount={stats.pending}
                            pendingAmount={stats.pendingAmount}
                            depositCount={stats.depositCount}
                            depositAmount={stats.depositAmount}
                            onRefresh={() => load(true)}
                            refreshing={refreshing}
                        />
                        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                            {statCard(
                                t.analytics.receivedSummary,
                                `${stats.depositCount} · ${formatAmount(stats.depositAmount)} USDT`
                            )}
                            {statCard(
                                t.analytics.pendingSummary,
                                `${stats.pending} · ${formatAmount(stats.pendingAmount)} USDT`
                            )}
                        </View>
                    </>
                )}
            </components.MerchantContent>
            </components.ScreenScroll>
        </View>
    );
};

export default Analytics;
