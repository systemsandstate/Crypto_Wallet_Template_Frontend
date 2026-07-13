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

import { components } from "../components";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { useAppSelector } from "../hooks/useAppSelector";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { api, MerchantWallet } from "../services/api";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { copyToClipboard } from "../utils/copyToClipboard";
import { showToast } from "../utils/toast";
import AllNetworksQrModal from "../components/AllNetworksQrModal";
import { svg } from "../svg";
import { DENSITY } from "../constants/density";

type ReceiveAssetRow = {
    network: UsdtNetwork;
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
    const merchant = useAppSelector((state) => state.auth.merchant);
    const tabBarInset = useTabBarInset(8);
    const [search, setSearch] = useState("");
    const [wallets, setWallets] = useState<MerchantWallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [allNetworksQrVisible, setAllNetworksQrVisible] = useState(false);

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

    const walletAddresses = useMemo(() => {
        const map: Partial<Record<UsdtNetwork, string>> = {};
        for (const network of availableNetworks) {
            const address = walletByNetwork[network]?.address?.trim();
            if (address) map[network] = address;
        }
        return map;
    }, [availableNetworks, walletByNetwork]);

    const defaultReceiveAddress = walletAddresses.BEP20 ?? availableNetworks.map((n) => walletAddresses[n]).find(Boolean) ?? "";

    const loadWallets = useCallback(async () => {
        setLoading(true);
        try {
            const [activeAddresses, res] = await Promise.all([
                prepareWalletContext(),
                api.getWallets(),
            ]);
            const byNetwork = Object.fromEntries(
                activeAddresses.map((row) => [row.network, row.address])
            );
            setWallets(
                (res.data.wallets ?? []).map((w) => ({
                    ...w,
                    address: byNetwork[w.network] ?? w.address,
                }))
            );
        } catch {
            setWallets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useInitialScreenLoad(loadWallets, () => setSearch(""));

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
                query.includes("tether")
            );
        },
        [t]
    );

    const assets = useMemo(() => {
        const query = search.trim().toLowerCase();
        const rows: ReceiveAssetRow[] = [];
        for (const network of availableNetworks) {
            const address = walletByNetwork[network]?.address?.trim() ?? "";
            if (!address) continue;
            rows.push({ network, symbol: "USDT", address });
        }
        return rows.filter((row) => matchesSearch(row, query));
    }, [availableNetworks, search, matchesSearch, walletByNetwork]);

    const handleCopy = useCallback(
        async (row: ReceiveAssetRow) => {
            const copied = await copyToClipboard(row.address);
            if (copied) {
                showToast(
                    formatMessage(t.wallet.accountNumberCopied, {
                        network: row.network,
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
            });
        },
        [navigation]
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                pageBody: {
                    flex: 1,
                    paddingHorizontal: DENSITY.pagePaddingH,
                    paddingTop: 6,
                },
                searchWrap: {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    minHeight: DENSITY.searchBarHeight,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                searchRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                },
                myQrBtn: {
                    width: DENSITY.searchBarHeight,
                    height: DENSITY.searchBarHeight,
                    borderRadius: DENSITY.searchBarHeight / 2,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: "center",
                    justifyContent: "center",
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
                assetList: {
                    flex: 1,
                    ...(Platform.OS === "web"
                        ? ({ minHeight: 0, overflow: "hidden" } as object)
                        : {}),
                },
                assetListContent: {},
                assetListContentGrow: {
                    flexGrow: 1,
                },
                assetRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: DENSITY.listRowPaddingV,
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
                    width: DENSITY.listIcon,
                    height: DENSITY.listIcon,
                    marginRight: 10,
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
                    fontSize: 14,
                    color: colors.mainDark,
                },
                assetKind: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginBottom: 2,
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
                    width: DENSITY.actionBtn,
                    height: DENSITY.actionBtn,
                    borderRadius: DENSITY.actionBtn / 2,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                loadingWrap: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 240,
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
    const hasActiveSearch = search.trim().length > 0;

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.wallet.receiveTitle} goBack={true} />
                <View style={styles.pageBody}>
                    <View style={styles.searchRow}>
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
                        {availableNetworks.length > 0 ? (
                            <TouchableOpacity
                                style={styles.myQrBtn}
                                onPress={() => setAllNetworksQrVisible(true)}
                                accessibilityRole="button"
                                accessibilityLabel={t.wallet.myQrCode}
                            >
                                <svg.QrCodeSvg color={colors.mainDark} size={20} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <ScrollView
                        style={styles.assetList}
                        contentContainerStyle={[
                            styles.assetListContent,
                            (loading || showEmptyState) && styles.assetListContentGrow,
                            { paddingBottom: tabBarInset },
                        ]}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                    >
                        {loading ? (
                            <View style={styles.loadingWrap}>
                                <LoadingSpinner size={48} />
                            </View>
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
                                return (
                                    <View key={row.network} style={styles.assetRow}>
                                        <View style={styles.assetLogoWrap}>
                                            <svg.UsdtMarkSvg size={DENSITY.listIcon} />
                                            <View style={styles.networkBadge}>
                                                <components.NetworkLogo
                                                    network={row.network}
                                                    size={DENSITY.listIconBadge}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.assetMeta}>
                                            <View style={styles.assetTitleRow}>
                                                <Text style={styles.assetSymbol}>{row.symbol}</Text>
                                                <View style={styles.networkPill}>
                                                    <Text style={styles.networkPillText}>{row.network}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.assetKind}>{t.withdraw.tetherUsd}</Text>
                                            <Text style={[styles.assetKind, { marginBottom: 2 }]}>
                                                {t.wallet.accountNumberLabel}
                                            </Text>
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

            <AllNetworksQrModal
                visible={allNetworksQrVisible}
                onClose={() => setAllNetworksQrVisible(false)}
                addresses={walletAddresses}
                fallbackAddress={defaultReceiveAddress}
                businessName={merchant?.businessName}
            />
        </View>
    );
};

export default ReceiveSelect;
