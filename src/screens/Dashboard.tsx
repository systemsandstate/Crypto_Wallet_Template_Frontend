import { View, Text, StyleSheet } from "react-native";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { svg } from "../svg";
import { components } from "../components";
import WalletDepositListItem from "../components/WalletDepositListItem";
import { api, PaymentRequest, WalletTransfer } from "../services/api";
import { resolveDisplayUsdtBalance } from "../utils/walletBalance";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import type { WalletQuickAction } from "../components/WalletQuickActions";
import { registerDashboardRefresh } from "../utils/dashboardRefresh";
import { syncDeviceWalletToServer } from "../services/wallet/syncDeviceWallet";

const sumAmounts = (items: PaymentRequest[]) =>
    items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);

const usdtDeposits = (items: WalletTransfer[]) =>
    items.filter((item) => item.type === "DEPOSIT" && item.currency === "USDT");

const sumDepositAmounts = (items: WalletTransfer[]) =>
    usdtDeposits(items).reduce((total, item) => total + (Number(item.amount) || 0), 0);

type RecentRow =
    | { kind: "payment"; key: string; sortAt: number; payment: PaymentRequest }
    | { kind: "deposit"; key: string; sortAt: number; deposit: WalletTransfer };

const Dashboard: React.FC = () => {
    const navigation: any = useNavigation();
    const { t } = useTranslation();
    const { colors, FONTS, isDark } = useTheme();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [recentRows, setRecentRows] = useState<RecentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        pendingAmount: 0,
        depositCount: 0,
        depositAmount: 0,
        walletBalance: 0,
    });
    const hasLoadedRef = useRef(false);
    const lastBalanceRef = useRef<number | null>(null);

    const quickActionsShellStyle = useMemo(
        () =>
            StyleSheet.create({
                shell: {
                    marginTop: 12,
                    borderRadius: 18,
                    backgroundColor: isDark ? "#22222C" : "#12121C",
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? colors.border : "transparent",
                    paddingHorizontal: 12,
                    paddingTop: 18,
                    paddingBottom: 20,
                },
            }),
        [colors.border, isDark]
    );

    const iconColor = colors.pureWhite;

    const handleReceive = useCallback(() => {
        navigation.navigate("ReceiveSelect");
    }, [navigation]);

    const quickActions = useMemo<WalletQuickAction[]>(
        () => [
            {
                key: "send",
                label: t.common.send,
                icon: <svg.SendSvg color={iconColor} size={22} />,
                onPress: () => navigation.navigate("SendSelect"),
            },
            {
                key: "receive",
                label: t.wallet.receiveTitle,
                icon: <svg.ReceiveSvg color={iconColor} size={22} />,
                onPress: handleReceive,
            },
            {
                key: "request",
                label: t.dashboard.request,
                icon: <svg.QrCodeSvg color={iconColor} size={22} />,
                onPress: () => navigation.navigate("CreateInvoice"),
            },
            {
                key: "history",
                label: t.dashboard.history,
                icon: <svg.HistorySvg color={iconColor} size={22} />,
                onPress: () => navigation.getParent()?.navigate("History"),
            },
        ],
        [handleReceive, iconColor, navigation, t]
    );

    const pageStyles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                },
                loadingOverlay: {
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(14, 14, 19, 0.72)" : "rgba(237, 240, 242, 0.82)",
                    zIndex: 100,
                },
            }),
        [isDark]
    );

    const applyDashboardData = useCallback(
        (
            items: PaymentRequest[],
            deposits: WalletTransfer[],
            balances: Awaited<ReturnType<typeof api.getWalletBalances>>["data"]["balances"]
        ) => {
            const pendingItems = items.filter((p) => p.status === "PENDING");
            const paymentRows: RecentRow[] = items.map((payment) => ({
                kind: "payment",
                key: `payment:${payment.id}`,
                sortAt: new Date(payment.paidAt || payment.createdAt).getTime(),
                payment,
            }));
            const depositRows: RecentRow[] = deposits.map((deposit) => ({
                kind: "deposit",
                key: deposit.id,
                sortAt: new Date(deposit.timestamp).getTime(),
                deposit,
            }));
            const merged = [...paymentRows, ...depositRows]
                .sort((a, b) => b.sortAt - a.sortAt)
                .slice(0, 5);

            const walletBalance = resolveDisplayUsdtBalance(balances, deposits);
            lastBalanceRef.current = walletBalance;

            setRecentRows(merged);
            setStats({
                pending: pendingItems.length,
                pendingAmount: sumAmounts(pendingItems),
                depositCount: usdtDeposits(deposits).length,
                depositAmount: sumDepositAmounts(deposits),
                walletBalance,
            });
        },
        []
    );

    const loadDashboard = useCallback(
        (opts?: { silent?: boolean }) => {
            const silent = Boolean(opts?.silent) && hasLoadedRef.current;
            if (!silent) setLoading(true);

            Promise.allSettled([
                api.listPayments({ limit: 100 }),
                api.getWalletBalances(),
                api.getWalletTransfers(),
            ])
                .then(([paymentsResult, balancesResult, transfersResult]) => {
                    const items =
                        paymentsResult.status === "fulfilled"
                            ? paymentsResult.value.data.items
                            : [];
                    const deposits =
                        transfersResult.status === "fulfilled"
                            ? transfersResult.value.data.transfers
                            : [];
                    const balances =
                        balancesResult.status === "fulfilled"
                            ? balancesResult.value.data.balances
                            : [];

                    applyDashboardData(items, deposits, balances);
                    hasLoadedRef.current = true;
                })
                .finally(() => {
                    if (!silent) setLoading(false);
                });
        },
        [applyDashboardData]
    );

    useEffect(() => {
        return registerDashboardRefresh(() => loadDashboard({ silent: true }));
    }, [loadDashboard]);

    // Refresh when Home is shown (e.g. after Receive) so RECEIVED + activity match balance.
    useFocusEffect(
        useCallback(() => {
            void (async () => {
                await syncDeviceWalletToServer();
                loadDashboard({ silent: hasLoadedRef.current });
            })();

            const pollMs = 12_000;
            const timer = setInterval(() => {
                void Promise.allSettled([api.getWalletBalances(), api.getWalletTransfers()]).then(
                    ([balancesResult, transfersResult]) => {
                        const balances =
                            balancesResult.status === "fulfilled"
                                ? balancesResult.value.data.balances
                                : [];
                        const transfers =
                            transfersResult.status === "fulfilled"
                                ? transfersResult.value.data.transfers
                                : [];
                        const next = resolveDisplayUsdtBalance(balances, transfers);
                        const prev = lastBalanceRef.current;
                        if (prev == null || Math.abs(next - prev) > 0.0000001) {
                            loadDashboard({ silent: true });
                        } else {
                            setStats((s) => ({ ...s, walletBalance: next }));
                        }
                    }
                );
            }, pollMs);

            return () => clearInterval(timer);
        }, [loadDashboard])
    );

    const accountLabel = merchant?.email
        ? `ACCT · ${merchant.email.split("@")[0].slice(0, 4).toUpperCase()} ****`
        : t.dashboard.merchantAccount;

    return (
        <View style={pageStyles.root}>
            <components.ScreenScroll>
                <components.MerchantTabHeader
                    eyebrow={t.dashboard.welcomeBack}
                    title={merchant?.businessName || t.common.merchant}
                    subtitle={t.dashboard.subtitle}
                    paddingBottom={72}
                />
                <components.MerchantContent style={{ marginTop: -56, marginBottom: 20 }}>
                    <components.MerchantBalanceCard
                        businessName={merchant?.businessName || t.common.merchant}
                        walletBalance={stats.walletBalance}
                        pendingCount={stats.pending}
                        pendingAmount={stats.pendingAmount}
                        depositCount={stats.depositCount}
                        depositAmount={stats.depositAmount}
                        accountLabel={accountLabel}
                        onRefresh={loadDashboard}
                        refreshing={loading}
                        onBalancePress={() => navigation.navigate("BalanceDetail")}
                    />
                    <View style={quickActionsShellStyle.shell}>
                        <components.WalletQuickActions actions={quickActions} variant="onDark" />
                    </View>
                </components.MerchantContent>

                <components.MerchantContent>
                    <Text style={{ ...FONTS.H4, color: colors.mainDark, marginBottom: 12 }}>
                        {t.dashboard.recentActivity}
                    </Text>
                    {recentRows.length === 0 ? (
                        <Text
                            style={{
                                color: colors.bodyTextColor,
                                textAlign: "center",
                                paddingVertical: 24,
                            }}
                        >
                            {t.dashboard.noRecentActivity}
                        </Text>
                    ) : (
                        recentRows.map((row) =>
                            row.kind === "payment" ? (
                                <components.PaymentListItem
                                    key={row.key}
                                    item={row.payment}
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
                                    onPress={() =>
                                        navigation.navigate("WalletDepositDetails", {
                                            deposit: row.deposit,
                                        })
                                    }
                                />
                            )
                        )
                    )}
                </components.MerchantContent>
            </components.ScreenScroll>
            {loading ? (
                <View style={pageStyles.loadingOverlay} pointerEvents="auto">
                    <components.LoadingSpinner size={48} />
                </View>
            ) : null}
        </View>
    );
};

export default Dashboard;
