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
import { USDT_NETWORKS, UsdtNetwork, NATIVE_SYMBOLS, ReceiveAsset } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { api, MerchantWallet } from "../services/api";
import { copyToClipboard } from "../utils/copyToClipboard";
import { showToast } from "../utils/toast";
import { svg } from "../svg";
import type { NetworkFilter } from "./SendNetworkSelect";

const QUICK_FILTER_NETWORKS: UsdtNetwork[] = ["ERC20", "SOL", "BEP20", "TRC20"];

type ReceiveSelectRouteParams = {
    networkFilter?: NetworkFilter;
};

type ReceiveAssetRow = {
    network: UsdtNetwork;
    asset: ReceiveAsset;
    symbol: string;
    address: string;
};

function truncateAddress(address: string, head = 7, tail = 6): string {
    if (address.length <= head + tail + 3) return address;
    return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

const ReceiveSelect: React.FC = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const route = useRoute();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<NetworkFilter>("ALL");
    const [wallets, setWallets] = useState<MerchantWallet[]>([]);
    const [loading, setLoading] = useState(true);

    const moreNetworkCount = USDT_NETWORKS.length;

    const walletByNetwork = useMemo(() => {
        const map: Partial<Record<UsdtNetwork, MerchantWallet>> = {};
        for (const wallet of wallets) {
            if ((USDT_NETWORKS as readonly string[]).includes(wallet.network)) {
                map[wallet.network as UsdtNetwork] = wallet;
            }
        }
        return map;
    }, [wallets]);

    const availableNetworks = useMemo(
        () =>
            USDT_NETWORKS.filter((network) => {
                const address = walletByNetwork[network]?.address;
                return Boolean(address?.trim());
            }),
        [walletByNetwork]
    );

    const loadWallets = useCallback(() => {
        setLoading(true);
        api.getWallets()
            .then((res) => setWallets(res.data.wallets))
            .catch(() => setWallets([]))
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            const params = route.params as ReceiveSelectRouteParams | undefined;
            if (params?.networkFilter !== undefined) {
                setFilter(params.networkFilter);
                navigation.setParams({ networkFilter: undefined });
            }
            setSearch("");
            loadWallets();
        }, [loadWallets, navigation, route.params])
    );

    const matchesSearch = useCallback(
        (row: ReceiveAssetRow, query: string) => {
            if (!query) return true;
            const label = getLocalizedNetworkLabel(row.network, t).toLowerCase();
            const address = row.address.toLowerCase();
            const sym = row.symbol.toLowerCase();
            return (
                label.includes(query) ||
                row.network.toLowerCase().includes(query) ||
                sym.includes(query) ||
                address.includes(query) ||
                query.includes("usdt") ||
                query.includes("tether") ||
                query.includes("trx") ||
                query.includes("bnb") ||
                query.includes("eth") ||
                query.includes("sol") ||
                query.includes("pol")
            );
        },
        [t]
    );

    const assets = useMemo(() => {
        const query = search.trim().toLowerCase();
        const rows: ReceiveAssetRow[] = [];
        for (const network of availableNetworks) {
            if (filter !== "ALL" && filter !== network) continue;
            const address = walletByNetwork[network]?.address?.trim() ?? "";
            if (!address) continue;
            rows.push({ network, asset: "USDT", symbol: "USDT", address });
            rows.push({
                network,
                asset: "NATIVE",
                symbol: NATIVE_SYMBOLS[network],
                address,
            });
        }
        return rows.filter((row) => matchesSearch(row, query));
    }, [availableNetworks, filter, search, matchesSearch, walletByNetwork]);

    const handleCopy = useCallback(
        async (row: ReceiveAssetRow) => {
            const copied = await copyToClipboard(row.address);
            if (copied) {
                showToast(
                    formatMessage(t.transaction.copiedToClipboard, {
                        label: row.symbol,
                    })
                );
            } else {
                showToast(t.transaction.couldNotCopy, "error");
            }
        },
        [t]
    );

    const handleOpenQr = useCallback(
        (row: ReceiveAssetRow) => {
            navigation.navigate("WalletReceive", {
                network: row.network,
                address: row.address,
                asset: row.asset,
            });
        },
        [navigation]
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                pageBody: {
                    flex: 1,
                    paddingHorizontal: 20,
                    paddingTop: 8,
                },
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
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                networkPillText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 10,
                    color: colors.bodyTextColor,
                },
                addressText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    ...(Platform.OS === "web"
                        ? ({
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                              wordBreak: "break-all",
                          } as object)
                        : {}),
                },
                actions: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginLeft: 8,
                },
                actionBtn: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
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
                setupLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue,
                    textDecorationLine: "underline",
                },
            }),
        [FONTS, colors]
    );

    const showEmptyState = !loading && assets.length === 0;
    const hasActiveSearch = search.trim().length > 0 || filter !== "ALL";

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.wallet.receiveTitle} goBack={true} />
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
                                navigation.navigate("SendNetworkSelect", {
                                    filter,
                                    returnScreen: "ReceiveSelect",
                                })
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
                                <Text style={styles.emptyTitle}>
                                    {hasActiveSearch
                                        ? t.withdraw.sendNoResults
                                        : t.wallet.selectReceiveNetworkDescription}
                                </Text>
                                {!hasActiveSearch ? (
                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation
                                                .getParent()
                                                ?.navigate("Profile", { screen: "WalletSetup" })
                                        }
                                        accessibilityRole="link"
                                    >
                                        <Text style={styles.setupLink}>{t.wallet.setupWallet}</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        ) : (
                            assets.map((row) => {
                                const networkLabel = getLocalizedNetworkLabel(row.network, t);
                                const isUsdt = row.asset === "USDT";
                                return (
                                    <View key={`${row.network}-${row.asset}`} style={styles.assetRow}>
                                        <View style={styles.assetLogoWrap}>
                                            {isUsdt ? (
                                                <>
                                                    <svg.UsdtMarkSvg size={44} />
                                                    <View style={styles.networkBadge}>
                                                        <components.NetworkLogo
                                                            network={row.network}
                                                            size={14}
                                                        />
                                                    </View>
                                                </>
                                            ) : (
                                                <components.NetworkLogo network={row.network} size={44} />
                                            )}
                                        </View>
                                        <View style={styles.assetMeta}>
                                            <View style={styles.assetTitleRow}>
                                                <Text style={styles.assetSymbol}>{row.symbol}</Text>
                                                <View style={styles.networkPill}>
                                                    <Text style={styles.networkPillText}>
                                                        {networkLabel}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text
                                                style={styles.addressText}
                                                numberOfLines={Platform.OS === "web" ? undefined : 1}
                                                selectable={Platform.OS === "web"}
                                            >
                                                {Platform.OS === "web"
                                                    ? row.address
                                                    : truncateAddress(row.address)}
                                            </Text>
                                        </View>
                                        <View style={styles.actions}>
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => handleOpenQr(row)}
                                                accessibilityRole="button"
                                                accessibilityLabel={t.wallet.tapForQr}
                                            >
                                                <svg.QrCodeSvg
                                                    color={colors.mainDark}
                                                    size={18}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => handleCopy(row)}
                                                accessibilityRole="button"
                                                accessibilityLabel={t.wallet.copyAddress}
                                            >
                                                <svg.CopySvg color={colors.mainDark} size={18} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default ReceiveSelect;
