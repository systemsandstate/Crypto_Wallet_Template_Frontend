import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, Platform } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAppSelector } from "../hooks/useAppSelector";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";

import { components } from "../components";
import DonutChart from "../components/charts/DonutChart";
import WeeklyBarChart from "../components/charts/WeeklyBarChart";
import { api, PaymentRequest, WalletTransfer } from "../services/api";
import { sumWalletBalances } from "../utils/walletBalance";
import { buildAnalyticsSnapshot, formatAnalyticsAmount } from "../utils/analyticsData";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { createMerchantTabPageStyles } from "../styles/merchantTabPageChrome";
import { DENSITY } from "../constants/density";
import { svg } from "../svg";

type StatItem = {
    key: string;
    label: string;
    value: number;
    color: string;
};

const cardShadow = (isDark: boolean) =>
    Platform.OS === "web"
        ? ({
              boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.28)" : "0 2px 10px rgba(0,0,0,0.05)",
          } as object)
        : { elevation: isDark ? 3 : 2 };

const Analytics: React.FC = () => {
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);

    const hasLoadedRef = useRef(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if (!hasLoadedRef.current) {
            setLoading(true);
        }
        try {
            const [paymentsRes, balancesRes, transfersRes] = await Promise.all([
                api.listPayments({ limit: 100 }),
                api.getWalletBalances().catch(() => ({
                    data: { balances: [] as Array<{ usdtBalance: number | null }> },
                })),
                api.getWalletTransfers().catch(() => ({ data: { transfers: [] as WalletTransfer[] } })),
            ]);
            setPayments(paymentsRes.data.items ?? []);
            setTransfers(transfersRes.data.transfers ?? []);
            setWalletBalance(sumWalletBalances(balancesRes.data.balances ?? []));
            hasLoadedRef.current = true;
        } catch {
            if (!hasLoadedRef.current) {
                setPayments([]);
                setTransfers([]);
                setWalletBalance(0);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useInitialScreenLoad(() => load(false));

    const snapshot = useMemo(
        () =>
            buildAnalyticsSnapshot(
                payments,
                transfers,
                walletBalance,
                {
                    green: colors.green,
                    red: colors.red,
                    accentBlue: colors.accentBlue,
                },
                {
                    received: t.analytics.legendReceived,
                    sent: t.analytics.legendSent,
                    pending: t.analytics.legendPending,
                },
                dateLocale
            ),
        [colors.accentBlue, colors.green, colors.red, dateLocale, payments, t, transfers, walletBalance]
    );

    const pageStyles = useMemo(() => createMerchantTabPageStyles(colors), [colors]);

    const stats = useMemo<StatItem[]>(
        () => [
            {
                key: "received",
                label: t.analytics.legendReceived,
                value: snapshot.receivedTotal,
                color: colors.green,
            },
            {
                key: "sent",
                label: t.analytics.legendSent,
                value: snapshot.sentTotal,
                color: colors.red,
            },
            {
                key: "pending",
                label: t.analytics.legendPending,
                value: snapshot.pendingTotal,
                color: colors.accentBlue,
            },
        ],
        [
            colors.accentBlue,
            colors.green,
            colors.red,
            snapshot.pendingTotal,
            snapshot.receivedTotal,
            snapshot.sentTotal,
            t.analytics.legendPending,
            t.analytics.legendReceived,
            t.analytics.legendSent,
        ]
    );

    const flowLegend = useMemo(
        () =>
            [
                {
                    color: colors.green,
                    label: t.analytics.legendReceived,
                    value: snapshot.receivedTotal,
                },
                {
                    color: colors.red,
                    label: t.analytics.legendSent,
                    value: snapshot.sentTotal,
                },
                {
                    color: colors.accentBlue,
                    label: t.analytics.legendPending,
                    value: snapshot.pendingTotal,
                },
            ].filter((item) => item.value > 0 || snapshot.activityTotal <= 0),
        [
            colors.accentBlue,
            colors.green,
            colors.red,
            snapshot.activityTotal,
            snapshot.pendingTotal,
            snapshot.receivedTotal,
            snapshot.sentTotal,
            t.analytics.legendPending,
            t.analytics.legendReceived,
            t.analytics.legendSent,
        ]
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingTop: DENSITY.sectionGap,
                    paddingBottom: 24,
                    gap: DENSITY.sectionGap,
                },
                card: {
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DENSITY.cardPaddingH,
                    paddingVertical: DENSITY.cardPadding,
                    ...cardShadow(isDark),
                },
                balanceCard: {
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DENSITY.cardPaddingH,
                    paddingVertical: 14,
                    ...cardShadow(isDark),
                },
                balanceLabel: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 4,
                },
                balanceValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.balanceWhole,
                    color: colors.mainDark,
                    letterSpacing: -0.5,
                },
                balanceMeta: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginTop: 6,
                },
                statRow: {
                    flexDirection: "row",
                    gap: 8,
                },
                statTile: {
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                    overflow: "hidden",
                    ...cardShadow(isDark),
                },
                statAccent: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                },
                statLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginBottom: 4,
                },
                statValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: colors.mainDark,
                },
                sectionHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 8,
                    marginBottom: 12,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                sectionTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                },
                sectionHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    maxWidth: "52%",
                    textAlign: "right",
                },
                flowLayout: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                },
                flowChartSlot: {
                    flexShrink: 0,
                },
                flowLegend: {
                    flex: 1,
                    minWidth: 0,
                    gap: 10,
                },
                flowLegendRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceMuted,
                },
                flowLegendDot: {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    flexShrink: 0,
                },
                flowLegendCopy: {
                    flex: 1,
                    minWidth: 0,
                },
                flowLegendLabel: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                },
                flowLegendValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 14,
                    color: colors.mainDark,
                    marginTop: 2,
                },
                flowLegendPct: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: colors.white,
                    overflow: "hidden",
                },
                refreshBtn: {
                    width: DENSITY.iconButton,
                    height: DENSITY.iconButton,
                    borderRadius: DENSITY.iconButton / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
            }),
        [FONTS, colors, isDark]
    );

    const formatAmount = (value: number) => `$${formatAnalyticsAmount(value, dateLocale)}`;

    const shareOfActivity = (value: number) => {
        if (snapshot.activityTotal <= 0) return 0;
        return Math.round((value / snapshot.activityTotal) * 100);
    };

    return (
        <View style={pageStyles.root}>
            <View style={pageStyles.headerWrap}>
                <components.MerchantTabHeader
                    eyebrow={merchant?.businessName || t.common.merchant}
                    title={t.analytics.title}
                    subtitle={t.analytics.subtitle}
                    headerTrailing={
                        <TouchableOpacity
                            style={styles.refreshBtn}
                            onPress={() => load(true)}
                            disabled={refreshing}
                            accessibilityRole="button"
                            accessibilityLabel={t.common.refresh}
                        >
                            {refreshing ? (
                                <LoadingSpinner size={16} />
                            ) : (
                                <svg.RefreshSvg color={colors.icon} size={16} />
                            )}
                        </TouchableOpacity>
                    }
                />
            </View>
            <View style={pageStyles.contentArea}>
                {loading ? (
                    <View style={pageStyles.loadingWrap}>
                        <LoadingSpinner size={48} />
                    </View>
                ) : (
                    <components.ScreenScroll
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
                        }
                    >
                        <components.MerchantContent style={styles.content}>
                            <View style={styles.balanceCard}>
                                <Text style={styles.balanceLabel}>{t.analytics.balanceMetric}</Text>
                                <Text style={styles.balanceValue} numberOfLines={1}>
                                    {formatAmount(snapshot.walletBalance)}
                                </Text>
                                <Text style={styles.balanceMeta}>
                                    {t.analytics.totalActivity}: {formatAmount(snapshot.activityTotal)}
                                </Text>
                            </View>

                            <View style={styles.statRow}>
                                {stats.map((item) => (
                                    <View key={item.key} style={styles.statTile}>
                                        <View
                                            style={[styles.statAccent, { backgroundColor: item.color }]}
                                        />
                                        <Text style={styles.statLabel} numberOfLines={1}>
                                            {item.label}
                                        </Text>
                                        <Text
                                            style={[styles.statValue, { color: item.color }]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.75}
                                        >
                                            {formatAmount(item.value)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.card}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>{t.analytics.moneyFlow}</Text>
                                    <Text style={styles.sectionHint} numberOfLines={2}>
                                        {t.analytics.moneyFlowHint}
                                    </Text>
                                </View>
                                <View style={styles.flowLayout}>
                                    <View style={styles.flowChartSlot}>
                                        <DonutChart
                                            segments={snapshot.segments}
                                            centerValue={formatAmount(snapshot.activityTotal)}
                                            centerLabel={t.analytics.totalActivity}
                                            emptyLabel={t.analytics.noActivity}
                                            size={148}
                                            strokeWidth={18}
                                            segmentGap={3}
                                            trackColor={colors.border}
                                            labelColor={colors.bodyTextColor}
                                            valueColor={colors.mainDark}
                                        />
                                    </View>
                                    <View style={styles.flowLegend}>
                                        {flowLegend.map((item) => {
                                            const share = shareOfActivity(item.value);
                                            return (
                                                <View key={item.label} style={styles.flowLegendRow}>
                                                    <View
                                                        style={[
                                                            styles.flowLegendDot,
                                                            { backgroundColor: item.color },
                                                        ]}
                                                    />
                                                    <View style={styles.flowLegendCopy}>
                                                        <Text
                                                            style={styles.flowLegendLabel}
                                                            numberOfLines={1}
                                                        >
                                                            {item.label}
                                                        </Text>
                                                        <Text style={styles.flowLegendValue}>
                                                            {formatAmount(item.value)}
                                                        </Text>
                                                    </View>
                                                    {snapshot.activityTotal > 0 ? (
                                                        <Text style={styles.flowLegendPct}>
                                                            {share}%
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.card}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>{t.analytics.last7Days}</Text>
                                    <Text style={styles.sectionHint} numberOfLines={2}>
                                        {t.analytics.last7DaysHint}
                                    </Text>
                                </View>
                                <WeeklyBarChart
                                    days={snapshot.week}
                                    receivedColor={colors.green}
                                    sentColor={colors.red}
                                    trackColor={colors.border}
                                    labelColor={colors.bodyTextColor}
                                    mutedColor={colors.surfaceMuted}
                                    receivedLabel={t.analytics.legendReceived}
                                    sentLabel={t.analytics.legendSent}
                                    emptyLabel={t.analytics.noActivityWeek}
                                    formatValue={(value) => formatAnalyticsAmount(value, dateLocale)}
                                />
                            </View>
                        </components.MerchantContent>
                    </components.ScreenScroll>
                )}
            </View>
        </View>
    );
};

export default Analytics;
