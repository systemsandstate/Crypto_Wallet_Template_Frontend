import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { svg } from "../svg";
import { components } from "../components";
import DashboardHomeHeader from "../components/DashboardHomeHeader";
import DashboardTransactionRow from "../components/DashboardTransactionRow";
import KivooLogo from "../components/KivooLogo";
import { api, PaymentRequest, WalletTransfer, invalidateCachedGet } from "../services/api";
import {
    filterBalancesForActiveWallet,
    filterTransfersForActiveWallet,
    filterTransfersForDisplay,
    buildRecentActivityRows,
    sumWalletBalances,
} from "../utils/walletBalance";
import { filterPaymentsForActivityFeed } from "../utils/walletActivityFeed";
import { registerDashboardRefresh } from "../utils/dashboardRefresh";
import { computePortfolioUsd } from "../utils/portfolioValue";
import { getTokenUsdPrices } from "../utils/tokenPrices";
import { resolveWalletAddressesForBalanceFilter, prepareWalletContext, syncDeviceWalletInBackground } from "../services/wallet/syncDeviceWallet";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import type { WalletQuickAction } from "../components/WalletQuickActions";
import { createMerchantTabPageStyles } from "../styles/merchantTabPageChrome";
import { useCounterpartyLabelsForTransfers } from "../hooks/useCounterpartyLabelsForTransfers";
import PayByEmailModal from "../components/PayByEmailModal";
import type { SendPlan } from "../utils/buildSendPlan";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { openTransferScreen } from "../utils/openTransferScreen";
import { asArray } from "../utils/asArray";
import { formatUsdtAmount } from "../utils/formatAmount";
import { DENSITY } from "../constants/density";

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
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [recentRows, setRecentRows] = useState<RecentRow[]>([]);
    const recentDeposits = useMemo(
        () =>
            recentRows
                .filter((row): row is Extract<RecentRow, { kind: "deposit" }> => row.kind === "deposit")
                .map((row) => row.deposit),
        [recentRows]
    );
    const getCounterpartyLabel = useCounterpartyLabelsForTransfers(recentDeposits);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        pending: 0,
        pendingAmount: 0,
        depositCount: 0,
        depositAmount: 0,
        walletBalance: 0,
    });
    const hasLoadedRef = useRef(false);
    const lastBalanceRef = useRef<number | null>(null);
    const depositsRef = useRef<WalletTransfer[]>([]);
    const paymentsRef = useRef<PaymentRequest[]>([]);
    const dashboardInFlightRef = useRef(false);
    const initialLoadDoneRef = useRef(false);
    const activeAddressesRef = useRef<Array<{ network: string; address: string }>>([]);

    const pageChromeStyles = useMemo(
        () =>
            StyleSheet.create({
                ...createMerchantTabPageStyles(colors),
                content: {
                    paddingTop: 4,
                    paddingBottom: 16,
                    gap: DENSITY.sectionGap,
                },
                transactionsCard: {
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DENSITY.listRowPaddingH,
                    paddingTop: 2,
                    paddingBottom: 4,
                    minHeight: 320,
                },
                transactionsHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                    marginBottom: 2,
                },
                transactionsTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                },
                viewAll: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.accentBlue,
                },
                emptyWrap: {
                    flexGrow: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 36,
                    paddingHorizontal: 20,
                    gap: 12,
                },
                emptyLogo: {
                    opacity: 0.9,
                    marginBottom: 4,
                },
                emptyText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                },
                emptyCta: {
                    marginTop: 8,
                    minWidth: 160,
                },
                brandFooter: {
                    alignItems: "center",
                    paddingTop: 8,
                    paddingBottom: 4,
                },
                brandFooterText: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                },
                brandFooterName: {
                    ...FONTS.Mulish_700Bold,
                    color: colors.accentBlue,
                },
            }),
        [FONTS, colors]
    );

    const actionIconColor = colors.accentBlue;

    const handleReceive = useCallback(() => {
        navigation.navigate("CashierGetPaid");
    }, [navigation]);

    const handleSendMoney = useCallback(async () => {
        await openTransferScreen(navigation, { returnScreen: "Home" });
    }, [navigation]);

    const handleScanToPay = useCallback(async () => {
        await openTransferScreen(navigation, { returnScreen: "Home", openScan: true, qrPay: true });
    }, [navigation]);

    const handlePayByEmailReady = useCallback(
        (input: { network: UsdtNetwork; plan: SendPlan }) => {
            navigation.push("Withdraw", {
                network: input.network,
                returnScreen: "Home",
                initialSendPlan: input.plan,
                openConfirm: true,
            });
        },
        [navigation]
    );

    const [payByEmailVisible, setPayByEmailVisible] = useState(false);

    const handleViewHistory = useCallback(() => {
        navigation.getParent()?.navigate("History");
    }, [navigation]);

    const resolveReceivedStats = useCallback(
        (usdtBalance: number, deposits: WalletTransfer[]) => {
            const depositAmount = sumDepositAmounts(deposits);
            const depositCount = usdtDeposits(deposits).length;
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

    const quickActions = useMemo<WalletQuickAction[]>(
        () => [
            {
                key: "send",
                label: t.dashboard.sendMoney,
                icon: <svg.SendSvg color={actionIconColor} size={DENSITY.quickActionIcon} />,
                onPress: () => void handleSendMoney(),
            },
            {
                key: "qr",
                label: t.dashboard.qrPay,
                icon: <svg.QrCodeSvg color={actionIconColor} size={DENSITY.quickActionIcon} />,
                onPress: () => void handleScanToPay(),
            },
            {
                key: "receive",
                label: t.common.getPaid,
                icon: <svg.ReceiveSvg color={actionIconColor} size={DENSITY.quickActionIcon} />,
                onPress: handleReceive,
            },
            {
                key: "history",
                label: t.tabs.history,
                icon: <svg.HistorySvg color={actionIconColor} size={DENSITY.quickActionIcon} />,
                onPress: handleViewHistory,
            },
        ],
        [
            actionIconColor,
            handleReceive,
            handleScanToPay,
            handleSendMoney,
            handleViewHistory,
            t,
        ]
    );

    const applyDashboardData = useCallback(
        (
            items: PaymentRequest[] | null | undefined,
            deposits: WalletTransfer[] | null | undefined,
            balances: Awaited<ReturnType<typeof api.getWalletBalances>>["data"]["balances"] | null | undefined,
            prices: Record<string, number>
        ) => {
            const safeItems = items ?? [];
            const safeDeposits = deposits ?? [];
            const safeBalances = balances ?? [];
            paymentsRef.current = safeItems;
            depositsRef.current = safeDeposits;

            const pendingItems = safeItems.filter((p) => p.status === "PENDING");
            const activityPayments = filterPaymentsForActivityFeed(safeItems, safeDeposits);
            const paymentRows: RecentRow[] = activityPayments.map((payment) => ({
                kind: "payment",
                key: `payment:${payment.id}`,
                sortAt: new Date(payment.paidAt || payment.createdAt).getTime(),
                payment,
            }));
            const depositRows: RecentRow[] = safeDeposits.map((deposit) => ({
                kind: "deposit",
                key: deposit.id,
                sortAt: new Date(deposit.timestamp).getTime(),
                deposit,
            }));
            const merged = buildRecentActivityRows(paymentRows, depositRows, 12);

            const walletBalance = computePortfolioUsd(safeBalances, prices);
            const usdtBalance = sumWalletBalances(safeBalances);
            lastBalanceRef.current = walletBalance;
            const received = resolveReceivedStats(usdtBalance, safeDeposits);

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
            balances: Awaited<ReturnType<typeof api.getWalletBalances>>["data"]["balances"] | null | undefined,
            prices: Record<string, number>
        ) => {
            const safeBalances = balances ?? [];
            const walletBalance = computePortfolioUsd(safeBalances, prices);
            const usdtBalance = sumWalletBalances(safeBalances);
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
                if (live) {
                    invalidateCachedGet("/merchant/wallets/transfers");
                    invalidateCachedGet("/payments/requests");
                }
                syncDeviceWalletInBackground({ force: live });

                const [
                    addressesSettled,
                    pricesSettled,
                    balancesSettled,
                    paymentsSettled,
                    transfersSettled,
                ] = await Promise.allSettled([
                    live ? prepareWalletContext() : resolveWalletAddressesForBalanceFilter(),
                    getTokenUsdPrices(),
                    api.getWalletBalances({ live: true }),
                    api.listPayments({ limit: 50 }),
                    api.getWalletTransfers(),
                ]);

                const activeAddresses = asArray(
                    addressesSettled.status === "fulfilled" ? addressesSettled.value : undefined
                );
                const prices =
                    pricesSettled.status === "fulfilled"
                        ? pricesSettled.value
                        : { USDT: 1, BNB: 600, ETH: 2500, TRX: 0.12 };

                const rawBalances = asArray(
                    balancesSettled.status === "fulfilled"
                        ? balancesSettled.value?.data?.balances
                        : undefined
                );
                const balances = filterBalancesForActiveWallet(rawBalances, activeAddresses);
                activeAddressesRef.current = activeAddresses;

                applyBalanceSnapshot(balances, prices);
                if (!silent) setRefreshing(false);

                const items = asArray(
                    paymentsSettled.status === "fulfilled"
                        ? paymentsSettled.value?.data?.items
                        : paymentsRef.current
                );
                const depositsRaw = asArray(
                    transfersSettled.status === "fulfilled"
                        ? transfersSettled.value?.data?.transfers
                        : depositsRef.current
                );
                const deposits = filterTransfersForDisplay(
                    filterTransfersForActiveWallet(depositsRaw, activeAddresses)
                );

                applyDashboardData(items, deposits, balances, prices);
                hasLoadedRef.current = true;
            } catch {
                // Avoid unhandled promise rejections when API payloads omit arrays.
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
            await loadDashboard({ silent: true, live: true });
        } finally {
            setRefreshing(false);
        }
    }, [loadDashboard]);

    useEffect(() => {
        if (initialLoadDoneRef.current) return;
        initialLoadDoneRef.current = true;
        void loadDashboard();
    }, [loadDashboard]);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedRef.current) return;
            void loadDashboard({ silent: true, live: true });
        }, [loadDashboard])
    );

    useEffect(() => {
        return registerDashboardRefresh(() => {
            void loadDashboard({ silent: true, live: true });
        });
    }, [loadDashboard]);

    const formatTime = useCallback(
        (iso: string) =>
            new Date(iso).toLocaleString(dateLocale, {
                hour: "numeric",
                minute: "2-digit",
            }),
        [dateLocale]
    );

    const displayName =
        merchant?.businessName?.trim().split(/\s+/)[0] ||
        merchant?.businessName ||
        t.common.merchant;

    return (
        <View style={pageChromeStyles.root}>
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
                            progressBackgroundColor={colors.white}
                        />
                    }
                >
                    <DashboardHomeHeader
                        name={displayName}
                        onNotificationsPress={handleViewHistory}
                        onBalancePress={() => navigation.navigate("BalanceDetail")}
                    />

                    <components.MerchantContent style={pageChromeStyles.content}>
                        <components.MerchantBalanceCard
                            businessName={displayName}
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

                        <components.WalletQuickActions
                            title={t.dashboard.quickActions}
                            actions={quickActions}
                            variant="banking"
                        />

                        <View style={pageChromeStyles.transactionsCard}>
                            <View style={pageChromeStyles.transactionsHeader}>
                                <Text style={pageChromeStyles.transactionsTitle}>
                                    {t.dashboard.lastTransactions}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleViewHistory}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.dashboard.viewAll}
                                >
                                    <Text style={pageChromeStyles.viewAll}>{t.dashboard.viewAll}</Text>
                                </TouchableOpacity>
                            </View>
                            {recentRows.length === 0 ? (
                                <View style={pageChromeStyles.emptyWrap}>
                                    <View style={pageChromeStyles.emptyLogo}>
                                        <KivooLogo size="md" />
                                    </View>
                                    <Text style={pageChromeStyles.emptyText}>
                                        {t.dashboard.noRecentActivity}
                                    </Text>
                                    <components.Button
                                        title={t.common.getPaid}
                                        onPress={handleReceive}
                                        size="compact"
                                        containerStyle={pageChromeStyles.emptyCta}
                                    />
                                </View>
                            ) : (
                                recentRows.map((row) => {
                                    if (row.kind === "payment") {
                                        const payment = row.payment;
                                        const name =
                                            payment.reference?.trim() || t.transaction.counterpartyUnknown;
                                        return (
                                            <DashboardTransactionRow
                                                key={row.key}
                                                name={name}
                                                timeLabel={formatTime(payment.paidAt || payment.createdAt)}
                                                amountLabel={`+$${formatUsdtAmount(payment.amount, dateLocale)}`}
                                                isCredit
                                                onPress={() =>
                                                    navigation.navigate("TransactionDetails", {
                                                        payment,
                                                        paymentId: payment.id,
                                                    })
                                                }
                                            />
                                        );
                                    }

                                    const deposit = row.deposit;
                                    const counterparty = getCounterpartyLabel(deposit);
                                    const isSend = deposit.type === "SEND";
                                    const name =
                                        counterparty?.name ||
                                        (isSend
                                            ? t.transaction.counterpartyUnknown
                                            : t.payment.depositReceived);
                                    const amount = `$${formatUsdtAmount(deposit.amount, dateLocale)}`;

                                    return (
                                        <DashboardTransactionRow
                                            key={row.key}
                                            name={name}
                                            timeLabel={formatTime(deposit.timestamp)}
                                            amountLabel={isSend ? `-${amount}` : `+${amount}`}
                                            isCredit={!isSend}
                                            onPress={() =>
                                                navigation.navigate("WalletDepositDetails", {
                                                    deposit,
                                                })
                                            }
                                        />
                                    );
                                })
                            )}
                        </View>

                        <View style={pageChromeStyles.brandFooter}>
                            <Text style={pageChromeStyles.brandFooterText}>
                                {t.dashboard.brandFooterPrefix}{" "}
                                <Text style={pageChromeStyles.brandFooterName}>Kivoo</Text>
                            </Text>
                        </View>
                    </components.MerchantContent>
                </components.ScreenScroll>
            </View>
            <PayByEmailModal
                visible={payByEmailVisible}
                onClose={() => setPayByEmailVisible(false)}
                onReadyToConfirm={handlePayByEmailReady}
            />
        </View>
    );
};

export default Dashboard;
