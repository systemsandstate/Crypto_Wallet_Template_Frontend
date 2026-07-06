import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Platform,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import React, { useCallback, useMemo, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { components } from "../components";
import LoadingSpinner from "../components/LoadingSpinner";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { api } from "../services/api";
import { sumWalletBalances, filterBalancesForActiveWallet } from "../utils/walletBalance";
import { computePortfolioUsd } from "../utils/portfolioValue";
import { getTokenUsdPrices } from "../utils/tokenPrices";
import { formatNativeAmount } from "../utils/formatAmount";
import { resolveWalletAddressesForFilter, syncDeviceWalletInBackground } from "../services/wallet/syncDeviceWallet";
import { svg } from "../svg";

type BalanceRow = {
    network: UsdtNetwork;
    usdtBalance: number | null;
    nativeBalance: number | null;
    nativeSymbol: string;
};

const NATIVE_SYMBOLS: Record<UsdtNetwork, string> = {
    TRC20: "TRX",
    ERC20: "ETH",
    BEP20: "BNB",
    POLYGON: "POL",
    SOL: "SOL",
};

const BalanceDetail: React.FC = () => {
    const navigation: any = useNavigation();
    const { t, locale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [rows, setRows] = useState<BalanceRow[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const hasLoadedRef = useRef(false);

    const dateLocale = locale === "es" ? "es-ES" : "en-US";

    const load = useCallback((isRefresh = false) => {
        const silent = hasLoadedRef.current;
        if (isRefresh) setRefreshing(true);
        else if (!silent) setLoading(true);

        void (async () => {
            try {
                syncDeviceWalletInBackground({ force: isRefresh });
                const [activeAddresses, tokenPrices, cached] = await Promise.all([
                    resolveWalletAddressesForFilter(),
                    getTokenUsdPrices(),
                    api.getWalletBalances(),
                ]);
                setPrices(tokenPrices);

                const applyRows = (
                    source: Awaited<ReturnType<typeof api.getWalletBalances>>["data"]["balances"]
                ) => {
                    const rows = filterBalancesForActiveWallet(source, activeAddresses);
                    const map = new Map(
                        rows.map((row) => [
                            row.network,
                            {
                                network: row.network as UsdtNetwork,
                                usdtBalance: row.usdtBalance,
                                nativeBalance: row.nativeBalance ?? null,
                                nativeSymbol:
                                    row.nativeSymbol ||
                                    NATIVE_SYMBOLS[row.network as UsdtNetwork] ||
                                    row.network,
                            },
                        ])
                    );
                    const ordered = USDT_NETWORKS.filter((network) => map.has(network)).map(
                        (network) => map.get(network)!
                    );
                    setRows(ordered);
                };

                applyRows(cached.data.balances);
                hasLoadedRef.current = true;
                setLoading(false);

                if (isRefresh) {
                    void api
                        .getWalletBalances({ live: true })
                        .then((live) => applyRows(live.data.balances))
                        .catch(() => {});
                }
            } catch {
                if (!hasLoadedRef.current) setRows([]);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        })();
    }, []);

    useFocusEffect(
        useCallback(() => {
            load(false);
        }, [load])
    );

    const totalPortfolio = useMemo(() => computePortfolioUsd(rows, prices), [rows, prices]);
    const totalUsdt = useMemo(() => sumWalletBalances(rows), [rows]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                body: {
                    flex: 1,
                    position: "relative",
                    minHeight: 0,
                },
                loadingCenter: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                },
                totalCard: {
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 8px rgba(27, 29, 77, 0.08)" } as object)
                        : {}),
                },
                totalCardWrap: {
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 12,
                    backgroundColor: colors.bgColor,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                scrollContent: {
                    paddingHorizontal: 20,
                    paddingTop: 8,
                    paddingBottom: 32,
                },
                totalLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                },
                totalValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 32,
                    color: colors.mainDark,
                },
                totalSub: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginTop: 4,
                },
                chainSection: {
                    marginBottom: 18,
                },
                chainHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                },
                chainTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 16,
                    color: colors.mainDark,
                },
                chainCard: {
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                },
                assetRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                assetRowLast: {
                    borderBottomWidth: 0,
                },
                logoWrap: {
                    width: 40,
                    height: 40,
                    marginRight: 12,
                    alignItems: "center",
                    justifyContent: "center",
                },
                networkBadge: {
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                assetMeta: {
                    flex: 1,
                    minWidth: 0,
                },
                assetTitleRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                },
                assetSymbol: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: colors.mainDark,
                },
                assetKind: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                },
                networkPill: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 6,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                networkPillText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 10,
                    color: colors.bodyTextColor,
                },
                assetRight: {
                    alignItems: "flex-end",
                    marginLeft: 8,
                },
                fiatValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: colors.mainDark,
                },
                cryptoValue: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginTop: 2,
                },
                emptyText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    paddingVertical: 32,
                },
            }),
        [FONTS, colors]
    );

    const formatToken = (value: number | null | undefined, maxDecimals = 6) => {
        const amount = value != null && Number.isFinite(value) ? value : 0;
        return amount.toLocaleString(dateLocale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxDecimals,
        });
    };

    const nativeUsd = (balance: number | null | undefined, symbol: string) => {
        const amount = balance != null && Number.isFinite(balance) ? balance : 0;
        return amount * (prices[String(symbol).toUpperCase()] ?? 0);
    };

    const formatNativeToken = (value: number | null | undefined) => formatNativeAmount(value, dateLocale);

    const formatFiat = (value: number | null | undefined) => {
        const amount = value != null && Number.isFinite(value) ? value : 0;
        return `$${amount.toLocaleString(dateLocale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const renderTokenRow = (
        key: string,
        symbol: string,
        kind: string,
        amount: number | null,
        fiat: string | null,
        logo: React.ReactNode,
        isLast: boolean,
        formatAmountFn: (value: number | null | undefined) => string = formatToken,
        onPress?: () => void
    ) => {
    const rowInner = (
        <>
            <View style={styles.logoWrap}>{logo}</View>
            <View style={styles.assetMeta}>
                <View style={styles.assetTitleRow}>
                    <Text style={styles.assetSymbol}>{symbol}</Text>
                    {kind ? (
                        <View style={styles.networkPill}>
                            <Text style={styles.networkPillText}>{kind}</Text>
                        </View>
                    ) : null}
                </View>
                <Text style={styles.assetKind}>
                    {symbol === "USDT" ? t.withdraw.tetherUsd : t.balance.gasToken}
                </Text>
            </View>
            <View style={styles.assetRight}>
                {fiat ? <Text style={styles.fiatValue}>{fiat}</Text> : null}
                <Text style={styles.cryptoValue}>
                    {formatAmountFn(amount)} {symbol}
                </Text>
            </View>
        </>
    );

    if (!onPress) {
        return (
            <View key={key} style={[styles.assetRow, isLast && styles.assetRowLast]}>
                {rowInner}
            </View>
        );
    }

    return (
        <TouchableOpacity
            key={key}
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.assetRow, isLast && styles.assetRowLast]}
        >
            {rowInner}
        </TouchableOpacity>
    );
};

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.balance.balanceDetailTitle} goBack={true} />
                {loading && rows.length === 0 ? (
                    <View style={styles.loadingCenter}>
                        <LoadingSpinner size={48} />
                    </View>
                ) : (
                    <View style={styles.body}>
                        <View style={styles.totalCardWrap}>
                            <View style={styles.totalCard}>
                                <Text style={styles.totalLabel}>{t.balance.balanceDetailTotal}</Text>
                                <Text style={styles.totalValue}>{formatFiat(totalPortfolio)}</Text>
                                <Text style={styles.totalSub}>
                                    {formatToken(totalUsdt)} USDT · {t.balance.onChainAllNetworks}
                                </Text>
                            </View>
                        </View>
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.scrollContent}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={() => load(true)}
                                    tintColor={colors.mainDark}
                                />
                            }
                        >
                            {rows.length === 0 ? (
                                <Text style={styles.emptyText}>{t.balance.balanceDetailEmpty}</Text>
                            ) : (
                                rows.map((row) => {
                                    const chainLabel = getLocalizedNetworkLabel(row.network, t);
                                    const networkShort = row.network;
                                    return (
                                        <View key={row.network} style={styles.chainSection}>
                                            <View style={styles.chainHeader}>
                                                <components.NetworkLogo
                                                    network={row.network}
                                                    size={28}
                                                />
                                                <Text style={styles.chainTitle}>{chainLabel}</Text>
                                            </View>
                                            <View style={styles.chainCard}>
                                                {renderTokenRow(
                                                    `${row.network}-usdt`,
                                                    "USDT",
                                                    networkShort,
                                                    row.usdtBalance,
                                                    formatFiat(row.usdtBalance),
                                                    <View>
                                                        <svg.UsdtMarkSvg size={40} />
                                                        <View style={styles.networkBadge}>
                                                            <components.NetworkLogo
                                                                network={row.network}
                                                                size={12}
                                                            />
                                                        </View>
                                                    </View>,
                                                    false
                                                )}
                                                {renderTokenRow(
                                                    `${row.network}-native`,
                                                    row.nativeSymbol,
                                                    "",
                                                    row.nativeBalance,
                                                    formatFiat(
                                                        nativeUsd(row.nativeBalance, row.nativeSymbol)
                                                    ),
                                                    <components.NetworkLogo
                                                        network={row.network}
                                                        size={36}
                                                    />,
                                                    true,
                                                    formatNativeToken,
                                                    row.nativeBalance != null &&
                                                        row.nativeBalance > 0
                                                        ? () =>
                                                              navigation.navigate("Withdraw", {
                                                                  network: row.network,
                                                                  asset: "NATIVE",
                                                              })
                                                        : undefined
                                                )}
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

export default BalanceDetail;
