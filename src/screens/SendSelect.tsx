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
import React, { useCallback, useMemo, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { api } from "../services/api";
import { resolveNetworkBalanceMap } from "../utils/walletBalance";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { svg } from "../svg";
import { DENSITY } from "../constants/density";
import { pickFundedNetworkLabel } from "../utils/pickFundedSendNetwork";
import PayByEmailModal from "../components/PayByEmailModal";
import QuickPayActionsRow from "../components/QuickPayActionsRow";
import type { SendPlan } from "../utils/buildSendPlan";

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
    const tabBarInset = useTabBarInset(8);
    const [search, setSearch] = useState("");
    const [balances, setBalances] = useState<Record<string, number | null>>({});
    const [loading, setLoading] = useState(true);
    const hasLoadedRef = useRef(false);
    const [receiveModalVisible, setReceiveModalVisible] = useState(false);
    const [payByEmailVisible, setPayByEmailVisible] = useState(false);

    const dateLocale = locale === "es" ? "es-ES" : "en-US";

    const fundedNetworks = useMemo(
        () =>
            USDT_NETWORKS.filter((network) => {
                const value = balances[network];
                return value != null && Number.isFinite(value) && value > 0;
            }),
        [balances]
    );

    const loadBalances = useCallback(async () => {
        const silent = hasLoadedRef.current;
        if (!silent) setLoading(true);
        try {
            const [activeAddresses, cached] = await Promise.all([
                prepareWalletContext(),
                api.getWalletBalances({ live: true }),
            ]);
            setBalances(resolveNetworkBalanceMap(cached.data.balances ?? [], activeAddresses));
        } catch {
            if (!hasLoadedRef.current) setBalances({});
        } finally {
            hasLoadedRef.current = true;
            setLoading(false);
        }
    }, []);

    useInitialScreenLoad(loadBalances, () => setSearch(""));

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
        return fundedNetworks.filter((network) => matchesSearch(network, query));
    }, [search, matchesSearch, fundedNetworks]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                searchWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    marginBottom: 6,
                    minHeight: DENSITY.searchBarHeight,
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
                    fontSize: 11,
                    color: colors.bodyTextColor,
                },
                assetRight: {
                    alignItems: "flex-end",
                    marginLeft: 8,
                },
                fiatValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 14,
                    color: colors.mainDark,
                },
                cryptoValue: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginTop: 2,
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
                buyLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue,
                    textDecorationLine: "underline",
                },
                pageBody: {
                    flex: 1,
                    paddingHorizontal: DENSITY.pagePaddingH,
                    paddingTop: 6,
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
    const hasActiveSearch = search.trim().length > 0;

    const handleScanToPay = useCallback(() => {
        const network =
            pickFundedNetworkLabel(balances, [...USDT_NETWORKS], 0, 0) ?? "BEP20";
        navigation.navigate("Withdraw", {
            network,
            returnScreen: "SendSelect",
            openScan: true,
            qrPay: true,
        });
    }, [balances, navigation]);

    const handlePayByEmailReady = useCallback(
        (input: { network: UsdtNetwork; plan: SendPlan }) => {
            navigation.push("Withdraw", {
                network: input.network,
                returnScreen: "SendSelect",
                initialSendPlan: input.plan,
                openConfirm: true,
            });
        },
        [navigation]
    );

    const quickPayActions = useMemo(
        () => [
            {
                key: "scan",
                title: t.withdraw.scanToPayBanner,
                icon: <svg.QrCodeSvg color={colors.accentBlue} size={18} />,
                onPress: handleScanToPay,
                accessibilityLabel: t.withdraw.scanToPayBanner,
            },
            {
                key: "email",
                title: t.payByEmail.bannerTitle,
                icon: <svg.EmailSvg color={colors.accentBlue} size={18} />,
                onPress: () => setPayByEmailVisible(true),
                accessibilityLabel: t.payByEmail.title,
            },
        ],
        [colors.accentBlue, handleScanToPay, t]
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.withdraw.title} goBack={true} />
                <View style={styles.pageBody}>
                    <View style={{ marginBottom: 12 }}>
                        <QuickPayActionsRow actions={quickPayActions} />
                    </View>

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
                        {loading && Object.keys(balances).length === 0 ? (
                            <View style={styles.loadingWrap}>
                                <LoadingSpinner size={48} />
                            </View>
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
                                return (
                                    <TouchableOpacity
                                        key={network}
                                        style={styles.assetRow}
                                        activeOpacity={0.7}
                                        onPress={() => navigation.navigate("Withdraw", { network })}
                                    >
                                        <View style={styles.assetLogoWrap}>
                                            <svg.UsdtMarkSvg size={DENSITY.listIcon} />
                                            <View style={styles.networkBadge}>
                                                <components.NetworkLogo network={network} size={DENSITY.listIconBadge} />
                                            </View>
                                        </View>
                                        <View style={styles.assetMeta}>
                                            <View style={styles.assetTitleRow}>
                                                <Text style={styles.assetSymbol}>USDT</Text>
                                                <View style={styles.networkPill}>
                                                    <Text style={styles.networkPillText}>{network}</Text>
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
            <PayByEmailModal
                visible={payByEmailVisible}
                onClose={() => setPayByEmailVisible(false)}
                onReadyToConfirm={handlePayByEmailReady}
            />
        </View>
    );
};

export default SendSelect;
