import { View, Text, Alert, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useCallback, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { api, MerchantWallet } from "../services/api";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { isWalletSetupLocally } from "../services/wallet/walletStorage";
import { copyToClipboard } from "../utils/copyToClipboard";
import { showToast } from "../utils/toast";
import { svg } from "../svg";

const MyWallet: React.FC = ({ navigation }: any) => {
    const { t, locale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [wallets, setWallets] = useState<MerchantWallet[]>([]);
    const [balances, setBalances] = useState<Record<string, number | null>>({});
    const [hasServerWallet, setHasServerWallet] = useState(false);
    const [localSetup, setLocalSetup] = useState(false);
    const [loading, setLoading] = useState(true);

    const dateLocale = locale === "es" ? "es-ES" : "en-US";

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString(dateLocale, {
            dateStyle: "medium",
            timeStyle: "short",
        });

    const styles = useMemo(
        () =>
            StyleSheet.create({
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 14 * 1.6,
                    marginBottom: 16,
                    textAlign: "center",
                },
                statusCard: {
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 8px rgba(27, 29, 77, 0.08)" } as object)
                        : {
                              elevation: 2,
                              shadowColor: colors.mainDark,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.08,
                              shadowRadius: 6,
                          }),
                },
                statusRow: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                },
                statusLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                },
                statusValue: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                },
                statusOk: {
                    color: colors.green,
                },
                statusWarn: {
                    color: colors.linkColor,
                },
                card: {
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 8px rgba(27, 29, 77, 0.08)" } as object)
                        : {
                              elevation: 2,
                              shadowColor: colors.mainDark,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.08,
                              shadowRadius: 6,
                          }),
                },
                networkRow: {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                },
                networkTitleRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 8,
                },
                networkLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    flexShrink: 1,
                },
                configuredBadge: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.green,
                },
                notConfiguredBadge: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.linkColor,
                },
                address: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 18,
                },
                addressRow: {
                    marginBottom: 4,
                },
                cardFooter: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    marginTop: 8,
                },
                cardFooterLeft: {
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 8,
                },
                copyButton: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                balanceText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.green,
                },
                meta: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginTop: 6,
                },
            }),
        [colors, FONTS]
    );

    const loadWallets = useCallback(() => {
        setLoading(true);
        Promise.all([api.getWallets(), api.getWalletBalances(), isWalletSetupLocally()])
            .then(([res, balanceRes, localReady]) => {
                setWallets(res.data.wallets);
                setHasServerWallet(res.data.hasWallet);
                setLocalSetup(localReady);
                const map: Record<string, number | null> = {};
                for (const row of balanceRes.data.balances) {
                    map[row.network] = row.usdtBalance;
                }
                setBalances(map);
            })
            .catch((err) => Alert.alert(t.common.error, err.message))
            .finally(() => setLoading(false));
    }, [t.common.error]);

    useFocusEffect(
        useCallback(() => {
            loadWallets();
        }, [loadWallets])
    );

    const getWallet = (network: UsdtNetwork): MerchantWallet | undefined =>
        wallets.find((w) => w.network === network);

    const handleCopyAddress = useCallback(
        async (address: string, network: UsdtNetwork) => {
            const copied = await copyToClipboard(address);
            if (copied) {
                showToast(
                    formatMessage(t.transaction.copiedToClipboard, {
                        label: getLocalizedNetworkLabel(network, t),
                    })
                );
            } else {
                showToast(t.transaction.couldNotCopy, "error");
            }
        },
        [t]
    );

    const handleOpenReceive = useCallback(
        (network: UsdtNetwork, wallet?: MerchantWallet) => {
            if (wallet?.address) {
                navigation.navigate("WalletReceive", { network, address: wallet.address });
                return;
            }
            Alert.alert(t.wallet.networkNotSetupTitle, t.wallet.networkNotSetupMessage, [
                { text: t.common.cancel, style: "cancel" },
                { text: t.wallet.setupWallet, onPress: () => navigation.navigate("WalletSetup") },
            ]);
        },
        [navigation, t]
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header title={t.wallet.myWalletTitle} goBack={true} />
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                    <components.MerchantContent style={{ paddingTop: 16 }}>
                        <Text style={styles.subtitle}>{t.wallet.myWalletDescription}</Text>

                        {!loading && (
                            <View style={styles.statusCard}>
                                <View style={styles.statusRow}>
                                    <Text style={styles.statusLabel}>{t.wallet.deviceWalletStatus}</Text>
                                    <Text
                                        style={[
                                            styles.statusValue,
                                            localSetup ? styles.statusOk : styles.statusWarn,
                                        ]}
                                    >
                                        {localSetup ? t.wallet.statusReady : t.wallet.statusNotSetup}
                                    </Text>
                                </View>
                                <View style={styles.statusRow}>
                                    <Text style={styles.statusLabel}>{t.wallet.serverSyncStatus}</Text>
                                    <Text
                                        style={[
                                            styles.statusValue,
                                            hasServerWallet ? styles.statusOk : styles.statusWarn,
                                        ]}
                                    >
                                        {hasServerWallet ? t.wallet.statusSynced : t.wallet.statusNotSynced}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {loading ? (
                            <LoadingSpinner size={40} style={{ marginVertical: 24 }} />
                        ) : (
                            USDT_NETWORKS.map((network) => {
                                const wallet = getWallet(network);
                                const configured = Boolean(wallet?.address);
                                return (
                                    <TouchableOpacity
                                        key={network}
                                        style={styles.card}
                                        activeOpacity={configured ? 0.75 : 1}
                                        onPress={() => handleOpenReceive(network, wallet)}
                                    >
                                        <View style={styles.networkRow}>
                                            <View style={styles.networkTitleRow}>
                                                <components.NetworkLogo network={network} size={22} />
                                                <Text style={styles.networkLabel}>
                                                    {getLocalizedNetworkLabel(network, t)} ({network})
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                {configured && (
                                                    <svg.QrCodeSvg size={16} color={colors.mainDark} />
                                                )}
                                                <Text
                                                    style={
                                                        configured
                                                            ? styles.configuredBadge
                                                            : styles.notConfiguredBadge
                                                    }
                                                >
                                                    {configured
                                                        ? t.wallet.networkConfigured
                                                        : t.wallet.networkNotConfigured}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.addressRow}>
                                            <Text style={styles.address} selectable>
                                                {wallet?.address || t.wallet.notConfigured}
                                            </Text>
                                        </View>
                                        {configured && (
                                            <View style={styles.cardFooter}>
                                                <View style={styles.cardFooterLeft}>
                                                    <Text style={styles.balanceText}>
                                                        {t.wallet.onChainBalance}:{" "}
                                                        {balances[network] == null
                                                            ? t.wallet.balanceUnavailable
                                                            : `${balances[network]!.toLocaleString(dateLocale, {
                                                                  minimumFractionDigits: 2,
                                                                  maximumFractionDigits: 6,
                                                              })} USDT`}
                                                    </Text>
                                                    {wallet?.updatedAt && (
                                                        <Text style={styles.meta}>
                                                            {t.wallet.lastUpdated}: {formatDate(wallet.updatedAt)}
                                                        </Text>
                                                    )}
                                                </View>
                                                {wallet?.address && (
                                                    <TouchableOpacity
                                                        style={styles.copyButton}
                                                        onPress={(e) => {
                                                            e?.stopPropagation?.();
                                                            handleCopyAddress(wallet.address, network);
                                                        }}
                                                        accessibilityRole="button"
                                                        accessibilityLabel={t.wallet.copyAddress}
                                                    >
                                                        <svg.CopySvg color={colors.mainDark} size={20} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                        {!configured && wallet?.updatedAt && (
                                            <Text style={styles.meta}>
                                                {t.wallet.lastUpdated}: {formatDate(wallet.updatedAt)}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}

                        <components.Button
                            title={t.wallet.reconfigureWallet}
                            onPress={() => navigation.navigate("WalletSetup")}
                            containerStyle={{ marginTop: 20 }}
                        />
                    </components.MerchantContent>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default MyWallet;
