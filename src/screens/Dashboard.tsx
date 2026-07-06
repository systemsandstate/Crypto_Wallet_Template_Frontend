import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { svg } from "../svg";
import { components } from "../components";
import WalletDepositListItem from "../components/WalletDepositListItem";
import { api, PaymentRequest, WalletTransfer, invalidateCachedGet, isCachedGetFresh } from "../services/api";
import {
    filterBalancesForActiveWallet,
    filterTransfersForActiveWallet,
    filterTransfersForDisplay,
    buildRecentActivityRows,
    sumWalletBalances,
} from "../utils/walletBalance";
import { computePortfolioUsd } from "../utils/portfolioValue";
import { getTokenUsdPrices } from "../utils/tokenPrices";
import { listLocalWallets } from "../services/wallet/walletStorage";
import { resolveWalletAddressesForFilter, syncDeviceWalletInBackground } from "../services/wallet/syncDeviceWallet";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import type { WalletQuickAction } from "../components/WalletQuickActions";
import { registerDashboardRefresh } from "../utils/dashboardRefresh";
import { createMerchantTabPageStyles } from "../styles/merchantTabPageChrome";

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
    const [refreshing, setRefreshing] = useState(false);
    const [activeWalletName, setActiveWalletName] = useState<string | null>(null);
    const [stats, setStats] = useState({
        pending: 0,
        pendingAmount: 0,
        depositCount: 0,
        depositAmount: 0,
        walletBalance: 0,
    });
    const hasLoadedRef = useRef(false);
    const lastBalanceRef = useRef<number | null>(null);
    const activeWalletIdRef = useRef<string | null>(null);
    const depositsRef = useRef<WalletTransfer[]>([]);
    const paymentsRef = useRef<PaymentRequest[]>([]);
    const dashboardInFlightRef = useRef(false);
    const lastLoadAtRef = useRef(0);
    const FOCUS_RELOAD_MS = 15_000;

    const pageChromeStyles = useMemo(
        () =>
            StyleSheet.create({
                ...createMerchantTabPageStyles(colors),
                content: {
                    paddingTop: 16,
                    paddingBottom: 24,
                },
                walletChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "rgba(255,255,255,0.16)",
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    maxWidth: 160,
                },
                walletChipIcon: {
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.accentBlue,
                    alignItems: "center",
                    justifyContent: "center",
                },
                walletChipText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: "#FFFFFF",
                    flexShrink: 1,
                },
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
        [FONTS, colors, isDark]
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

    const openWallets = useCallback(() => {
        const root = navigation.getParent()?.getParent();
        if (root) {
            root.navigate("Wallets");
            return;
        }
        navigation.navigate("Wallets");
    }, [navigation]);

    const refreshActiveWallet = useCallback(async (): Promise<boolean> => {
        try {
            const wallets = await listLocalWallets();
            const active = wallets.find((wallet) => wallet.isActive);
            const nextId = active?.id ?? null;
            const nextName = active?.name ?? null;
            const walletChanged =
                activeWalletIdRef.current != null &&
                nextId != null &&
                activeWalletIdRef.current !== nextId;
            if (walletChanged) {
                lastBalanceRef.current = 0;
                setStats({
                    pending: 0,
                    pendingAmount: 0,
                    depositCount: 0,
                    depositAmount: 0,
                    walletBalance: 0,
                });
                setRecentRows([]);
                depositsRef.current = [];
                paymentsRef.current = [];
                hasLoadedRef.current = false;
            }
            activeWalletIdRef.current = nextId;
            setActiveWalletName(nextName);
            return walletChanged;
        } catch {
            activeWalletIdRef.current = null;
            setActiveWalletName(null);
            return false;
        }
    }, []);

    const resolveReceivedStats = useCallback(
        (usdtBalance: number, deposits: WalletTransfer[]) => {
            const depositAmount = sumDepositAmounts(deposits);
            const depositCount = usdtDeposits(deposits).length;
            // Balance updates from live RPC before chain history is indexed — keep received in sync.
            if (usdtBalance > depositAmount + 0.000001) {
                return {
                    depositAmount: usdtBalance,
                    depositCount: Math.max(depositCount, 1),
                };
            }
            return { depositAmount, depositCount };
        },
        []
    );

    const applyDashboardData = useCallback(
        (
            items: PaymentRequest[],
            deposits: WalletTransfer[],
            balances: Awaited<ReturnType<typeof api.getWalletBalances>>["data"]["balances"],
            prices: Record<string, number>
        ) => {
            paymentsRef.current = items;
            depositsRef.current = deposits;

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
            const merged = buildRecentActivityRows(paymentRows, depositRows, 8);

            const walletBalance = computePortfolioUsd(balances, prices);
            const usdtBalance = sumWalletBalances(balances);
            lastBalanceRef.current = walletBalance;
            const received = resolveReceivedStats(usdtBalance, deposits);

            setRecentRows(merged);
            setStats({
                pending: pendingItems.length,
                pendingAmount: sumAmounts(pendingItems),
                depositCount: received.depositCount,
                depositAmount: received.depositAmount,
                walletBalance,
            });
        },
        [resolveReceivedStats]
    );

    const applyBalanceSnapshot = useCallback(
        (
            balances: Awaited<ReturnType<typeof api.getWalletBalances>>["data"]["balances"],
            prices: Record<string, number>
        ) => {
            const walletBalance = computePortfolioUsd(balances, prices);
            const usdtBalance = sumWalletBalances(balances);
            lastBalanceRef.current = walletBalance;
            const received = resolveReceivedStats(usdtBalance, depositsRef.current);

            setStats((prev) => ({
                ...prev,
                walletBalance,
                depositCount: received.depositCount,
                depositAmount: received.depositAmount,
            }));
        },
        [resolveReceivedStats]
    );

    const loadDashboard = useCallback(
        async (opts?: { silent?: boolean; live?: boolean }) => {
            if (dashboardInFlightRef.current) return;
            dashboardInFlightRef.current = true;

            const silent = Boolean(opts?.silent) && hasLoadedRef.current;
            const live = Boolean(opts?.live);
            if (!silent) setRefreshing(true);

            try {
                syncDeviceWalletInBackground({ force: live });
                if (live) {
                    invalidateCachedGet("/merchant/wallets/transfers");
                    invalidateCachedGet("/payments/requests");
                }

                const [
                    addressesSettled,
                    pricesSettled,
                    balancesSettled,
                    paymentsSettled,
                    transfersSettled,
                ] = await Promise.allSettled([
                    resolveWalletAddressesForFilter(),
                    getTokenUsdPrices(),
                    live ? api.getWalletBalances({ live: true }) : api.getWalletBalances(),
                    api.listPayments({ limit: 50 }),
                    api.getWalletTransfers(),
                ]);

                const activeAddresses =
                    addressesSettled.status === "fulfilled" ? addressesSettled.value : [];
                const prices =
                    pricesSettled.status === "fulfilled"
                        ? pricesSettled.value
                        : { USDT: 1, BNB: 600, ETH: 2500, TRX: 0.12, POL: 0.45, SOL: 150 };

                const balances =
                    balancesSettled.status === "fulfilled"
                        ? filterBalancesForActiveWallet(
                              balancesSettled.value.data.balances,
                              activeAddresses
                          )
                        : [];

                if (balances.length > 0) {
                    applyBalanceSnapshot(balances, prices);
                    if (!silent) setRefreshing(false);
                }

                const items =
                    paymentsSettled.status === "fulfilled"
                        ? paymentsSettled.value.data.items
                        : paymentsRef.current;
                const depositsRaw =
                    transfersSettled.status === "fulfilled"
                        ? transfersSettled.value.data.transfers
                        : depositsRef.current;
                const deposits = filterTransfersForDisplay(
                    filterTransfersForActiveWallet(depositsRaw, activeAddresses)
                );

                applyDashboardData(items, deposits, balances, prices);
                hasLoadedRef.current = true;
            } finally {
                dashboardInFlightRef.current = false;
                if (!silent) setRefreshing(false);
            }
        },
        [applyBalanceSnapshot, applyDashboardData]
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshActiveWallet();
            await loadDashboard({ silent: true, live: true });
        } finally {
            setRefreshing(false);
        }
    }, [loadDashboard, refreshActiveWallet]);

    useEffect(() => {
        return registerDashboardRefresh(() => {
            invalidateCachedGet("/merchant/wallets/transfers");
            invalidateCachedGet("/payments/requests");
            loadDashboard({ silent: true });
        });
    }, [loadDashboard]);

    useFocusEffect(
        useCallback(() => {
            void (async () => {
                const walletChanged = await refreshActiveWallet();
                syncDeviceWalletInBackground({ force: walletChanged });
                const silent = hasLoadedRef.current;
                if (
                    silent &&
                    !walletChanged &&
                    Date.now() - lastLoadAtRef.current < FOCUS_RELOAD_MS &&
                    isCachedGetFresh("/merchant/wallets/balances", 12_000)
                ) {
                    return;
                }
                await loadDashboard({ silent });
                lastLoadAtRef.current = Date.now();
            })();
        }, [loadDashboard, refreshActiveWallet])
    );

    return (
        <View style={pageChromeStyles.root}>
            <View style={pageChromeStyles.headerWrap}>
                <components.MerchantTabHeader
                    eyebrow={t.dashboard.welcomeBack}
                    title={merchant?.businessName || t.common.merchant}
                    subtitle={t.dashboard.subtitle}
                    subtitleAccessory={
                        activeWalletName ? (
                            <TouchableOpacity
                                style={pageChromeStyles.walletChip}
                                onPress={openWallets}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel={t.wallet.walletsTitle}
                            >
                                <View style={pageChromeStyles.walletChipIcon}>
                                    <svg.WalletSvg color="#FFFFFF" size={11} variant="outline" />
                                </View>
                                <Text style={pageChromeStyles.walletChipText} numberOfLines={1}>
                                    {activeWalletName}
                                </Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            </View>

            <View style={pageChromeStyles.contentArea}>
                <components.ScreenScroll
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                void onRefresh();
                            }}
                            tintColor={colors.accentBlue}
                            colors={[colors.accentBlue]}
                            progressBackgroundColor={isDark ? "#22222C" : "#FFFFFF"}
                        />
                    }
                >
                    <components.MerchantContent style={pageChromeStyles.content}>
                        <components.MerchantBalanceCard
                            businessName={merchant?.businessName || t.common.merchant}
                            walletBalance={stats.walletBalance}
                            pendingCount={stats.pending}
                            pendingAmount={stats.pendingAmount}
                            depositCount={stats.depositCount}
                            depositAmount={stats.depositAmount}
                            onBalancePress={() => navigation.navigate("BalanceDetail")}
                            onRefresh={() => {
                                void onRefresh();
                            }}
                            refreshing={refreshing}
                        />
                        <View style={pageChromeStyles.shell}>
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
            </View>
        </View>
    );
};

export default Dashboard;
