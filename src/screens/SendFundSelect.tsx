import { View, Text, StyleSheet, Platform } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { components } from "../components";
import DashboardWalletCards from "../components/DashboardWalletCards";
import DashboardTransactionRow from "../components/DashboardTransactionRow";
import { api, WalletTransfer } from "../services/api";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";
import {
    resolveNetworkBalanceMap,
    filterTransfersForActiveWallet,
    filterTransfersForDisplay,
} from "../utils/walletBalance";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";
import { useCounterpartyLabelsForTransfers } from "../hooks/useCounterpartyLabelsForTransfers";
import { formatUsdtAmount } from "../utils/formatAmount";

const RECENT_SEND_LIMIT = 5;

const SendFundSelect: React.FC = () => {
    const navigation: any = useNavigation();
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [balances, setBalances] = useState<Partial<Record<UsdtNetwork, number | null>>>({});
    const [recentSends, setRecentSends] = useState<WalletTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const getCounterpartyLabel = useCounterpartyLabelsForTransfers(recentSends);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                content: {
                    paddingTop: DENSITY.sectionGap,
                    paddingBottom: 16,
                    gap: DENSITY.sectionGap,
                },
                card: {
                    width: "100%",
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DENSITY.cardPaddingH,
                    paddingVertical: DENSITY.cardPadding,
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" } as object)
                        : { elevation: 2 }),
                },
                title: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                    marginBottom: 6,
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.bodyTextColor,
                    marginBottom: 16,
                },
                sectionHeader: {
                    paddingBottom: 6,
                    marginBottom: 2,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                sectionTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                },
                loadingWrap: {
                    alignItems: "center",
                    paddingVertical: 32,
                },
                loadingRecent: {
                    marginVertical: 12,
                },
                emptyText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    paddingVertical: 16,
                },
            }),
        [FONTS, colors]
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadingRecent(true);
        try {
            const [activeAddresses, cached, transfersResult] = await Promise.all([
                prepareWalletContext(),
                api.getWalletBalances({ live: true }),
                api.getWalletTransfers(),
            ]);

            const map = resolveNetworkBalanceMap(cached.data.balances ?? [], activeAddresses);
            const next: Partial<Record<UsdtNetwork, number | null>> = {};
            for (const network of USDT_NETWORKS) {
                const value = map[network];
                next[network] = typeof value === "number" ? value : null;
            }
            setBalances(next);

            const sends = filterTransfersForDisplay(
                filterTransfersForActiveWallet(
                    transfersResult.data.transfers ?? [],
                    activeAddresses
                )
            )
                .filter((transfer) => transfer.type === "SEND")
                .sort(
                    (a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )
                .slice(0, RECENT_SEND_LIMIT);

            setRecentSends(sends);
        } catch {
            setBalances({});
            setRecentSends([]);
        } finally {
            setLoading(false);
            setLoadingRecent(false);
        }
    }, []);

    const { reload, hasLoadedRef } = useInitialScreenLoad(loadData);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedRef.current) return;
            void reload();
        }, [hasLoadedRef, reload])
    );

    const formatTime = useCallback(
        (iso: string) =>
            new Date(iso).toLocaleString(dateLocale, {
                dateStyle: "medium",
                timeStyle: "short",
            }),
        [dateLocale]
    );

    const fundedNetworks = useMemo(
        () =>
            USDT_NETWORKS.filter((network) => {
                const value = balances[network];
                return typeof value === "number" && Number.isFinite(value) && value > 0;
            }),
        [balances]
    );

    const handleCardPress = useCallback(
        (network: UsdtNetwork) => {
            navigation.navigate("Withdraw", {
                network,
                returnScreen: "SendFundSelect",
                lockNetwork: true,
            });
        },
        [navigation]
    );

    const renderRecentSend = (transfer: WalletTransfer) => {
        const counterparty = getCounterpartyLabel(transfer);
        const name = counterparty?.name || t.transaction.counterpartyUnknown;
        const amount = `$${formatUsdtAmount(transfer.amount, dateLocale)}`;

        return (
            <DashboardTransactionRow
                key={transfer.id}
                name={name}
                timeLabel={formatTime(transfer.timestamp)}
                amountLabel={`-${amount}`}
                isCredit={false}
                onPress={() =>
                    navigation.navigate("WalletDepositDetails", {
                        deposit: transfer,
                    })
                }
            />
        );
    };

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.dashboard.sendMoney} goBack border />
                <components.FormScrollView
                    withTabBarInset
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <components.MerchantContent style={styles.content}>
                        <View style={styles.card}>
                            <Text style={styles.title}>{t.withdraw.chooseBalanceCardTitle}</Text>
                            <Text style={styles.subtitle}>{t.withdraw.chooseBalanceCardMessage}</Text>
                            {loading ? (
                                <View style={styles.loadingWrap}>
                                    <LoadingSpinner size={40} />
                                </View>
                            ) : fundedNetworks.length === 0 ? (
                                <Text style={styles.emptyText}>{t.withdraw.noFundedCards}</Text>
                            ) : (
                                <DashboardWalletCards
                                    balances={balances}
                                    onCardPress={handleCardPress}
                                    showSectionTitle={false}
                                    variant="stack"
                                    fundedOnly
                                />
                            )}
                        </View>

                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t.withdraw.recentSends}</Text>
                            </View>
                            {loadingRecent ? (
                                <LoadingSpinner size={32} style={styles.loadingRecent} />
                            ) : recentSends.length === 0 ? (
                                <Text style={styles.emptyText}>{t.withdraw.noRecentSends}</Text>
                            ) : (
                                recentSends.map(renderRecentSend)
                            )}
                        </View>
                    </components.MerchantContent>
                </components.FormScrollView>
            </SafeAreaView>
        </View>
    );
};

export default SendFundSelect;
