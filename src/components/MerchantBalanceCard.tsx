import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import React, { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Shadow } from "react-native-shadow-2";

import { svg } from "../svg";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";

type Props = {
    businessName: string;
    walletBalance: number;
    pendingCount: number;
    pendingAmount: number;
    depositCount: number;
    depositAmount: number;
    accountLabel?: string;
    onRefresh?: () => void;
    refreshing?: boolean;
    onBalancePress?: () => void;
};

const formatAmount = (value: number, locale: string) => {
    const safe = Number.isFinite(value) ? value : 0;
    return safe.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const MerchantBalanceCard: React.FC<Props> = ({
    businessName,
    walletBalance,
    pendingCount,
    pendingAmount,
    depositCount,
    depositAmount,
    accountLabel,
    onRefresh,
    refreshing = false,
    onBalancePress,
}) => {
    const { t, dateLocale } = useTranslation();
    const { colors, isDark, FONTS } = useTheme();
    const [whole, fraction = "00"] = formatAmount(walletBalance, dateLocale).split(".");

    const styles = useMemo(
        () =>
            StyleSheet.create({
                shadowWrap: {
                    width: "100%",
                },
                androidShadowWrap: {
                    width: "100%",
                    elevation: 8,
                    shadowColor: isDark ? "#000000" : "#062664",
                },
                card: {
                    width: "100%",
                    borderRadius: 18,
                    backgroundColor: isDark ? "#22222C" : "#12121C",
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? colors.border : "transparent",
                    paddingHorizontal: 22,
                    paddingTop: 18,
                    paddingBottom: 14,
                    overflow: "hidden",
                },
                cardAndroid: {
                    elevation: 0,
                },
                topRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                },
                chipOuter: {
                    borderRadius: 5,
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 6px rgba(0, 0, 0, 0.45)" } as object)
                        : {
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.4,
                              shadowRadius: 3,
                              elevation: 4,
                          }),
                },
                chip: {
                    width: 38,
                    height: 28,
                    borderRadius: 5,
                    paddingHorizontal: 5,
                    paddingVertical: 6,
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderTopColor: "rgba(255, 248, 210, 0.75)",
                    borderLeftColor: "rgba(255, 235, 170, 0.45)",
                    borderRightColor: "rgba(70, 45, 5, 0.55)",
                    borderBottomColor: "rgba(45, 28, 0, 0.7)",
                    overflow: "hidden",
                },
                chipHighlight: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 9,
                    backgroundColor: "rgba(255, 255, 255, 0.28)",
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                },
                chipLine: {
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: "rgba(45, 30, 0, 0.5)",
                },
                chipLineMid: {
                    width: "72%",
                    alignSelf: "center",
                },
                network: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    letterSpacing: 1.2,
                    color: "rgba(255,255,255,0.72)",
                    textTransform: "uppercase",
                },
                topLeft: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                },
                refreshButton: {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.1)",
                },
                account: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.72)",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                },
                mainContentRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 10,
                },
                balanceCol: {
                    flex: 1,
                    minWidth: 0,
                },
                statsCol: {
                    alignItems: "flex-end",
                    paddingTop: 2,
                },
                balanceRow: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    marginBottom: 4,
                },
                balanceWhole: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 34,
                    lineHeight: 38,
                    color: colors.pureWhite,
                },
                balanceFraction: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 20,
                    lineHeight: 30,
                    color: colors.pureWhite,
                    marginBottom: 2,
                },
                balanceCurrency: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.8)",
                    marginLeft: 8,
                    marginBottom: 6,
                },
                balanceLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 9,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: "#959BBF",
                    marginBottom: 4,
                },
                balanceHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.55)",
                },
                balanceTapHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.45)",
                    marginTop: 2,
                },
                footerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingTop: 8,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: "rgba(255,255,255,0.1)",
                },
                metaLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 8,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "#959BBF",
                    marginBottom: 4,
                },
                merchantName: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 13,
                    color: colors.pureWhite,
                    letterSpacing: 0.6,
                },
                statsRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    marginBottom: 6,
                },
                statBlock: {
                    alignItems: "flex-end",
                    minWidth: 48,
                },
                statDivider: {
                    width: 1,
                    height: 24,
                    backgroundColor: "rgba(255,255,255,0.14)",
                    marginHorizontal: 8,
                },
                statValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: "#EECC55",
                },
                statSub: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.65)",
                },
                brandMark: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                brandTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 10,
                    color: colors.pureWhite,
                    letterSpacing: 0.8,
                },
            }),
        [FONTS, colors.border, colors.pureWhite, isDark]
    );

    const statsPanel = (
        <View style={styles.statsCol}>
            <View style={styles.statsRow}>
                <View style={styles.statBlock}>
                    <Text style={styles.metaLabel}>{t.balance.pending}</Text>
                    <Text style={styles.statValue}>{pendingCount}</Text>
                    <Text style={styles.statSub}>{formatAmount(pendingAmount, dateLocale)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBlock}>
                    <Text style={styles.metaLabel}>{t.balance.received}</Text>
                    <Text style={[styles.statValue, { color: "#7BE0B8" }]}>{depositCount}</Text>
                    <Text style={styles.statSub}>{formatAmount(depositAmount, dateLocale)}</Text>
                </View>
            </View>
            <View style={styles.brandMark}>
                <svg.UsdtMarkSvg size={24} />
                <Text style={styles.brandTitle}>USDT</Text>
            </View>
        </View>
    );

    const balanceContent = onBalancePress ? (
        <TouchableOpacity
            onPress={onBalancePress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t.balance.viewBalanceDetails}
        >
            <View style={styles.balanceRow}>
                <Text style={styles.balanceWhole}>{whole}</Text>
                <Text style={styles.balanceFraction}>.{fraction}</Text>
                <Text style={styles.balanceCurrency}>USDT</Text>
            </View>
            <Text style={styles.balanceLabel}>{t.balance.walletBalance}</Text>
            <Text style={styles.balanceHint}>{t.balance.onChainAllNetworks}</Text>
            <Text style={styles.balanceTapHint}>{t.balance.viewBalanceDetails}</Text>
        </TouchableOpacity>
    ) : (
        <>
            <View style={styles.balanceRow}>
                <Text style={styles.balanceWhole}>{whole}</Text>
                <Text style={styles.balanceFraction}>.{fraction}</Text>
                <Text style={styles.balanceCurrency}>USDT</Text>
            </View>
            <Text style={styles.balanceLabel}>{t.balance.walletBalance}</Text>
            <Text style={styles.balanceHint}>{t.balance.onChainAllNetworks}</Text>
        </>
    );

    const cardBody = (
        <>
            <View style={styles.topRow}>
                <View style={styles.topLeft}>
                    <View style={styles.chipOuter}>
                        <LinearGradient
                            colors={["#FFF4C2", "#F0D060", "#D4AF37", "#B8860B", "#8B6914"]}
                            locations={[0, 0.22, 0.5, 0.78, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.chip}
                        >
                            <View style={styles.chipHighlight} />
                            <View style={styles.chipLine} />
                            <View style={[styles.chipLine, styles.chipLineMid]} />
                            <View style={styles.chipLine} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.network} numberOfLines={1}>
                        {t.balance.multiChain}
                    </Text>
                </View>
                {onRefresh ? (
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={onRefresh}
                        disabled={refreshing}
                        accessibilityRole="button"
                        accessibilityLabel={t.common.refresh}
                    >
                        <svg.RefreshSvg size={18} />
                    </TouchableOpacity>
                ) : null}
            </View>

            <Text style={styles.account}>{accountLabel || t.balance.merchantWallet}</Text>

            <View style={styles.mainContentRow}>
                <View style={styles.balanceCol}>{balanceContent}</View>
                {statsPanel}
            </View>

            <View style={styles.footerRow}>
                <Text style={styles.metaLabel}>{t.common.merchant}</Text>
                <Text style={[styles.merchantName, { marginLeft: 8 }]} numberOfLines={1}>
                    {(businessName || t.common.merchant).toUpperCase()}
                </Text>
            </View>
        </>
    );

    if (Platform.OS === "android") {
        return (
            <View style={styles.androidShadowWrap}>
                <View style={[styles.card, styles.cardAndroid]}>{cardBody}</View>
            </View>
        );
    }

    return (
        <Shadow
            distance={18}
            startColor={isDark ? "rgba(0, 0, 0, 0.35)" : "rgba(6, 38, 100, 0.18)"}
            endColor={isDark ? "rgba(0, 0, 0, 0.05)" : "rgba(6, 38, 100, 0.02)"}
            offset={[0, 8]}
            containerStyle={styles.shadowWrap}
            style={styles.card}
        >
            {cardBody}
        </Shadow>
    );
};

export default MerchantBalanceCard;
