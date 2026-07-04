import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
        Platform,
} from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";

import { components } from "../components";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { api } from "../services/api";
import { svg } from "../svg";
import type { NetworkFilter } from "./SendNetworkSelect";

/** Networks shown as quick chips before the “more” pill. */
const QUICK_FILTER_NETWORKS: UsdtNetwork[] = ["ERC20", "SOL", "BEP20", "TRC20"];

type SendSelectRouteParams = {
    networkFilter?: NetworkFilter;
};

const SendEmptyIllustration: React.FC<{ color: string }> = ({ color }) => (
    <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View
            style={{
                width: 120,
                height: 100,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <View
                style={{
                    width: 56,
                    height: 72,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: color,
                    opacity: 0.35,
                    backgroundColor: "transparent",
                }}
            />
            <View
                style={{
                    position: "absolute",
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 3,
                    borderColor: color,
                    opacity: 0.4,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ translateX: 28 }, { translateY: 18 }],
                }}
            >
                <Text style={{ fontSize: 22, color, opacity: 0.5 }}>⌕</Text>
            </View>
        </View>
    </View>
);

const SendSelect: React.FC = ({ navigation }: any) => {
    const { t, locale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const route = useRoute();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<NetworkFilter>("ALL");
    const [balances, setBalances] = useState<Record<string, number | null>>({});
    const [loading, setLoading] = useState(true);
    const [receiveModalVisible, setReceiveModalVisible] = useState(false);

    const dateLocale = locale === "es" ? "es-ES" : "en-US";
    const moreNetworkCount = USDT_NETWORKS.length;

    const fundedNetworks = useMemo(
        () =>
            USDT_NETWORKS.filter((network) => {
                const value = balances[network];
                return value != null && Number.isFinite(value) && value > 0;
            }),
        [balances]
    );

    const loadBalances = useCallback(() => {
        setLoading(true);
        api.getWalletBalances()
            .then((res) => {
                const map: Record<string, number | null> = {};
                for (const row of res.data.balances) {
                    map[row.network] = row.usdtBalance;
                }
                setBalances(map);
            })
            .catch(() => setBalances({}))
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            const params = route.params as SendSelectRouteParams | undefined;
            if (params?.networkFilter !== undefined) {
                setFilter(params.networkFilter);
                navigation.setParams({ networkFilter: undefined });
            }
            setSearch("");
            loadBalances();
        }, [loadBalances, navigation, route.params])
    );

    const matchesSearch = useCallback(
        (network: UsdtNetwork, query: string) => {
            if (!query) return true;
            const label = getLocalizedNetworkLabel(network, t).toLowerCase();
            return (
                label.includes(query) ||
                network.toLowerCase().includes(query) ||
                query.includes("usdt") ||
                query.includes("tether")
            );
        },
        [t]
    );

    const assets = useMemo(() => {
        const query = search.trim().toLowerCase();
        return fundedNetworks
            .filter((network) => filter === "ALL" || filter === network)
            .filter((network) => matchesSearch(network, query));
    }, [filter, search, matchesSearch, fundedNetworks]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                searchWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 24,
                    paddingHorizontal: 14,
                    marginBottom: 8,
                    minHeight: 44,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                searchIcon: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: colors.bodyTextColor,
                    marginRight: 8,
                },
                searchInput: {
                    flex: 1,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.mainDark,
                    paddingVertical: 10,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
                filterRow: {
                    flexDirection: "row",
                    gap: 10,
                    paddingRight: 8,
                    alignItems: "center",
                },
                filterScroll: {
                    flexGrow: 0,
                    marginBottom: 8,
                },
                filterAll: {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.white,
                    borderWidth: 2,
                    borderColor: colors.border,
                },
                filterAllActive: {
                    borderColor: colors.accentBlue,
                },
                filterAllText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                },
                filterChip: {
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.white,
                    borderWidth: 2,
                    borderColor: colors.border,
                    overflow: "hidden",
                },
                filterChipActive: {
                    borderColor: colors.accentBlue,
                },
                morePill: {
                    flexDirection: "row",
                    alignItems: "center",
                    height: 48,
                    paddingHorizontal: 14,
                    borderRadius: 24,
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 4,
                },
                morePillText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                },
                moreChevron: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                },
                assetRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                networkBadge: {
                    position: "absolute",
                    right: -2,
                    bottom: -2,
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                assetLogoWrap: {
                    width: 44,
                    height: 44,
                    marginRight: 12,
                },
                assetMeta: {
                    flex: 1,
                    minWidth: 0,
                },
                assetTitleRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 4,
                },
                assetSymbol: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 16,
                    color: colors.mainDark,
                },
                networkPill: {
                    backgroundColor: colors.headerBg,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                },
                networkPillText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 10,
                    color: colors.pureWhite,
                },
                assetName: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                },
                assetRight: {
                    alignItems: "flex-end",
                    marginLeft: 8,
                },
                fiatValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 16,
                    color: colors.mainDark,
                },
                cryptoValue: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginTop: 2,
                },
                emptyWrap: {
                    alignItems: "center",
                    paddingTop: 48,
                    paddingHorizontal: 24,
                },
                emptyTitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 20,
                },
                buyLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue,
                    textDecorationLine: "underline",
                },
                pageBody: {
                    flex: 1,
                    paddingHorizontal: 20,
                    paddingTop: 8,
                },
                assetList: {
                    flex: 1,
                    ...(Platform.OS === "web"
                        ? ({ minHeight: 0, overflow: "hidden" } as object)
                        : {}),
                },
                assetListContent: {
                    paddingBottom: 24,
                },
                assetListContentGrow: {
                    flexGrow: 1,
                },
            }),
        [FONTS, colors]
    );

    const formatBalance = (value: number | null | undefined) => {
        const amount = value != null && Number.isFinite(value) ? value : 0;
        return amount.toLocaleString(dateLocale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6,
        });
    };

    const formatFiat = (value: number | null | undefined) => {
        const amount = value != null && Number.isFinite(value) ? value : 0;
        return `$${amount.toLocaleString(dateLocale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const showEmptyState = !loading && assets.length === 0;
    const hasActiveSearch = search.trim().length > 0 || filter !== "ALL";

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.withdraw.title} goBack={true} />
                <View style={styles.pageBody}>
                    <View style={styles.searchWrap}>
                        <Text style={styles.searchIcon}>⌕</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t.withdraw.sendSearchPlaceholder}
                            placeholderTextColor={colors.placeholder}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled
                        style={styles.filterScroll}
                        contentContainerStyle={styles.filterRow}
                    >
                        <TouchableOpacity
                            style={[styles.filterAll, filter === "ALL" && styles.filterAllActive]}
                            onPress={() => setFilter("ALL")}
                            accessibilityRole="button"
                            accessibilityLabel={t.withdraw.sendAllNetworks}
                        >
                            <Text style={styles.filterAllText}>{t.withdraw.sendAllNetworks}</Text>
                        </TouchableOpacity>
                        {QUICK_FILTER_NETWORKS.map((network) => (
                            <TouchableOpacity
                                key={network}
                                style={[
                                    styles.filterChip,
                                    filter === network && styles.filterChipActive,
                                ]}
                                onPress={() => setFilter(network)}
                                accessibilityRole="button"
                                accessibilityLabel={getLocalizedNetworkLabel(network, t)}
                            >
                                <components.NetworkLogo network={network} size={28} />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.morePill}
                            onPress={() =>
                                navigation.navigate("SendNetworkSelect", { filter })
                            }
                            accessibilityRole="button"
                            accessibilityLabel={t.withdraw.moreNetworks}
                        >
                            <Text style={styles.morePillText}>{moreNetworkCount}</Text>
                            <Text style={styles.moreChevron}>▼</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <ScrollView
                        style={styles.assetList}
                        contentContainerStyle={[
                            styles.assetListContent,
                            (loading || showEmptyState) && styles.assetListContentGrow,
                        ]}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                    >
                        {loading ? (
                            <LoadingSpinner size={40} style={{ marginTop: 12 }} />
                        ) : showEmptyState ? (
                            <View style={styles.emptyWrap}>
                                <SendEmptyIllustration color={colors.border} />
                                <Text style={styles.emptyTitle}>
                                    {hasActiveSearch
                                        ? t.withdraw.sendNoResults
                                        : t.withdraw.sendNoAssets}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setReceiveModalVisible(true)}
                                    accessibilityRole="link"
                                >
                                    <Text style={styles.buyLink}>{t.withdraw.buyCryptocurrency}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            assets.map((network) => {
                                const balance = balances[network];
                                const networkLabel = getLocalizedNetworkLabel(network, t);
                                return (
                                    <TouchableOpacity
                                        key={network}
                                        style={styles.assetRow}
                                        activeOpacity={0.7}
                                        onPress={() => navigation.navigate("Withdraw", { network })}
                                    >
                                        <View style={styles.assetLogoWrap}>
                                            <svg.UsdtMarkSvg size={44} />
                                            <View style={styles.networkBadge}>
                                                <components.NetworkLogo network={network} size={14} />
                                            </View>
                                        </View>
                                        <View style={styles.assetMeta}>
                                            <View style={styles.assetTitleRow}>
                                                <Text style={styles.assetSymbol}>USDT</Text>
                                                <View style={styles.networkPill}>
                                                    <Text style={styles.networkPillText}>
                                                        {networkLabel}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.assetName}>{t.withdraw.tetherUsd}</Text>
                                        </View>
                                        <View style={styles.assetRight}>
                                            <Text style={styles.fiatValue}>{formatFiat(balance)}</Text>
                                            <Text style={styles.cryptoValue}>
                                                {formatBalance(balance)} USDT
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>

            <components.ReceiveNetworkModal
                visible={receiveModalVisible}
                onClose={() => setReceiveModalVisible(false)}
                onSetupWallet={() =>
                    navigation.getParent()?.navigate("Profile", { screen: "WalletSetup" })
                }
            />
        </View>
    );
};

export default SendSelect;
