import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from "react-native";
import React, { useMemo, useState } from "react";

import { svg } from "../svg";
import LoadingSpinner from "./LoadingSpinner";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";

const STACK_OF_COINS = require("../assets/stackofcoins.png");

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
    walletBalance,
    onRefresh,
    refreshing = false,
    onBalancePress,
}) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [balanceVisible, setBalanceVisible] = useState(true);
    const formatted = formatAmount(walletBalance, dateLocale);
    const [whole, fraction = "00"] = formatted.split(".");

    const styles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    width: "100%",
                    borderRadius: DENSITY.cardRadius,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DENSITY.cardPaddingH,
                    paddingTop: DENSITY.cardPadding,
                    paddingBottom: DENSITY.cardPadding,
                    overflow: "hidden",
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" } as object)
                        : { elevation: 2 }),
                },
                topRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                },
                topLeft: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                },
                accountType: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                },
                menuBtn: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                },
                bodyRow: {
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    marginBottom: 10,
                },
                balanceCol: {
                    flex: 1,
                    minWidth: 0,
                },
                balanceRow: {
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 2,
                },
                balanceWhole: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.balanceWhole,
                    lineHeight: DENSITY.balanceWhole + 4,
                    color: colors.mainDark,
                },
                balanceFraction: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.balanceFraction,
                    lineHeight: DENSITY.balanceFraction + 4,
                    color: colors.mainDark,
                },
                balanceHidden: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.balanceHidden,
                    lineHeight: DENSITY.balanceHidden + 4,
                    color: colors.mainDark,
                    letterSpacing: 3,
                },
                eyeBtn: {
                    padding: 2,
                    marginTop: 2,
                },
                decor: {
                    width: 64,
                    height: 64,
                    alignItems: "center",
                    justifyContent: "center",
                },
                decorImage: {
                    width: 58,
                    height: 58,
                },
                footerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                },
                allAccountBtn: {
                    backgroundColor: colors.accentBlue,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                },
                allAccountText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.pureWhite,
                },
                pendingHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 10,
                    color: colors.bodyTextColor,
                },
            }),
        [FONTS, colors]
    );

    const balanceBlock = balanceVisible ? (
        <View style={styles.balanceRow}>
            <Text style={styles.balanceWhole}>$ {whole}</Text>
            <Text style={styles.balanceFraction}>.{fraction}</Text>
        </View>
    ) : (
        <Text style={styles.balanceHidden}>$ ••••••</Text>
    );

    const balanceWrapper = onBalancePress ? (
        <TouchableOpacity
            onPress={onBalancePress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t.balance.viewBalanceDetails}
        >
            {balanceBlock}
        </TouchableOpacity>
    ) : (
        balanceBlock
    );

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.topLeft}>
                    <svg.WalletSvg color={colors.accentBlue} size={16} />
                    <Text style={styles.accountType}>{t.dashboard.personalUsd}</Text>
                </View>
                {onRefresh ? (
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={onRefresh}
                        disabled={refreshing}
                        accessibilityRole="button"
                        accessibilityLabel={t.common.refresh}
                    >
                        {refreshing ? (
                            <LoadingSpinner size={16} shellColor={colors.border} arcColor={colors.accentBlue} />
                        ) : (
                            <svg.RefreshSvg color={colors.icon} size={16} />
                        )}
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.bodyRow}>
                <View style={styles.balanceCol}>
                    {balanceWrapper}
                    <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setBalanceVisible((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={
                            balanceVisible ? t.dashboard.hideBalance : t.dashboard.showBalance
                        }
                    >
                        {balanceVisible ? (
                            <svg.EyeOffSvg color={colors.icon} size={14} />
                        ) : (
                            <svg.EyeSvg color={colors.icon} size={14} />
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.decor}>
                    <Image source={STACK_OF_COINS} style={styles.decorImage} resizeMode="contain" />
                </View>
            </View>

            <View style={styles.footerRow}>
                {onBalancePress ? (
                    <TouchableOpacity
                        style={styles.allAccountBtn}
                        onPress={onBalancePress}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={t.dashboard.allAccount}
                    >
                        <Text style={styles.allAccountText}>{t.dashboard.allAccount}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.allAccountBtn}>
                        <Text style={styles.allAccountText}>{t.dashboard.allAccount}</Text>
                    </View>
                )}
                <Text style={styles.pendingHint}>{t.balance.onChainAllNetworks}</Text>
            </View>
        </View>
    );
};

export default MerchantBalanceCard;
