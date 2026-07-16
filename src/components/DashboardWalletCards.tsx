import React, { useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
} from "react-native";

import NetworkLogo from "./NetworkLogo";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import { DENSITY } from "../constants/density";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { formatUsdtAmount } from "../utils/formatAmount";

const CARD_ORDER: UsdtNetwork[] = ["BEP20", "TRC20", "ERC20"];

const CARD_TITLE_KEYS: Record<UsdtNetwork, "bep20Card" | "trc20Card" | "erc20Card"> = {
    BEP20: "bep20Card",
    TRC20: "trc20Card",
    ERC20: "erc20Card",
};

type Props = {
    balances: Partial<Record<UsdtNetwork, number | null | undefined>>;
    onCardPress: (network: UsdtNetwork) => void;
    sectionTitle?: string;
    showSectionTitle?: boolean;
    variant?: "carousel" | "stack";
    fundedOnly?: boolean;
};

const DashboardWalletCards: React.FC<Props> = ({
    balances,
    onCardPress,
    sectionTitle,
    showSectionTitle = true,
    variant = "carousel",
    fundedOnly = false,
}) => {
    const { colors, FONTS, isDark } = useTheme();
    const { t, dateLocale } = useTranslation();

    const visibleNetworks = useMemo(
        () =>
            fundedOnly
                ? CARD_ORDER.filter((network) => {
                      const raw = balances[network];
                      return typeof raw === "number" && Number.isFinite(raw) && raw > 0;
                  })
                : CARD_ORDER,
        [balances, fundedOnly]
    );

    const styles = useMemo(() => {
        // Cards stay white / black / blue — ignore flashy network brand colors and dark gold accents.
        const accentBlue = isDark ? "#6B9FFF" : "#2563EB";
        const logoBg = isDark ? "rgba(107, 159, 255, 0.12)" : "#EFF6FF";
        const shadow =
            Platform.OS === "web"
                ? ({
                      boxShadow: isDark
                          ? "0 1px 8px rgba(0,0,0,0.24)"
                          : "0 1px 6px rgba(15,23,42,0.06)",
                  } as object)
                : { elevation: 1 };

        return StyleSheet.create({
            sectionTitle: {
                ...FONTS.Mulish_700Bold,
                fontSize: DENSITY.sectionTitle,
                color: colors.mainDark,
                marginBottom: 8,
            },
            scroll: {
                marginHorizontal: -DENSITY.pagePaddingH,
                ...(Platform.OS === "web" ? ({ overflow: "visible" } as object) : {}),
            },
            scrollContent: {
                paddingHorizontal: DENSITY.pagePaddingH,
                paddingVertical: 4,
                paddingBottom: 8,
                gap: 10,
                alignItems: "stretch",
            },
            card: {
                width: DENSITY.walletCardW,
                minHeight: DENSITY.walletCardH,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingTop: 12,
                paddingBottom: 12,
                justifyContent: "space-between",
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadow,
            },
            cardBody: {
                marginTop: 10,
            },
            cardTitle: {
                ...FONTS.Mulish_600SemiBold,
                fontSize: 12,
                lineHeight: 16,
                color: colors.bodyTextColor,
            },
            balance: {
                ...FONTS.Mulish_700Bold,
                fontSize: 16,
                lineHeight: 20,
                color: colors.mainDark,
                marginTop: 2,
                letterSpacing: -0.2,
            },
            balanceSub: {
                ...FONTS.Mulish_400Regular,
                fontSize: 10,
                lineHeight: 14,
                color: colors.bodyTextColor,
                marginTop: 2,
            },
            stackList: {
                gap: 10,
            },
            stackCard: {
                width: "100%",
            },
            stackCardInner: {
                width: "100%",
                minHeight: 72,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadow,
            },
            stackLeft: {
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
                gap: 12,
            },
            logoWrap: {
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: logoBg,
                borderWidth: 1,
                borderColor: colors.border,
            },
            stackMeta: {
                flex: 1,
                minWidth: 0,
            },
            stackCardTitle: {
                ...FONTS.Mulish_700Bold,
                fontSize: 14,
                color: colors.mainDark,
            },
            stackCardSub: {
                ...FONTS.Mulish_400Regular,
                fontSize: 11,
                color: colors.bodyTextColor,
                marginTop: 2,
            },
            stackRight: {
                alignItems: "flex-end",
                justifyContent: "center",
                marginLeft: 12,
                minWidth: 72,
            },
            stackAmount: {
                ...FONTS.Mulish_700Bold,
                fontSize: 16,
                color: colors.mainDark,
            },
            stackChevron: {
                ...FONTS.Mulish_600SemiBold,
                fontSize: 18,
                color: accentBlue,
                marginTop: 2,
                lineHeight: 18,
            },
            cardTop: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            },
            cardLogoWrap: {
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: logoBg,
                borderWidth: 1,
                borderColor: colors.border,
            },
            cardAccent: {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: accentBlue,
            },
        });
    }, [FONTS, colors, isDark]);

    const resolvedTitle = sectionTitle ?? t.dashboard.yourCards;

    const renderCard = (network: UsdtNetwork) => {
        const titleKey = CARD_TITLE_KEYS[network];
        const raw = balances[network];
        const amount = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
        const formatted = formatUsdtAmount(amount, dateLocale);

        return (
            <TouchableOpacity
                key={network}
                activeOpacity={0.82}
                onPress={() => onCardPress(network)}
                accessibilityRole="button"
                accessibilityLabel={`${t.dashboard[titleKey]} ${formatted} USDT`}
                style={variant === "stack" ? styles.stackCard : undefined}
            >
                {variant === "stack" ? (
                    <View style={styles.stackCardInner}>
                        <View style={styles.stackLeft}>
                            <View style={styles.logoWrap}>
                                <NetworkLogo network={network} size={22} />
                            </View>
                            <View style={styles.stackMeta}>
                                <Text style={styles.stackCardTitle} numberOfLines={1}>
                                    {t.dashboard[titleKey]}
                                </Text>
                                <Text style={styles.stackCardSub}>USDT</Text>
                            </View>
                        </View>
                        <View style={styles.stackRight}>
                            <Text style={styles.stackAmount}>${formatted}</Text>
                            <Text style={styles.stackChevron}>›</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardLogoWrap}>
                                <NetworkLogo network={network} size={16} />
                            </View>
                            <View style={styles.cardAccent} />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>{t.dashboard[titleKey]}</Text>
                            <Text style={styles.balance}>${formatted}</Text>
                            <Text style={styles.balanceSub}>USDT</Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View>
            {showSectionTitle ? <Text style={styles.sectionTitle}>{resolvedTitle}</Text> : null}
            {variant === "stack" ? (
                <View style={styles.stackList}>{visibleNetworks.map(renderCard)}</View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                >
                    {visibleNetworks.map(renderCard)}
                </ScrollView>
            )}
        </View>
    );
};

export default DashboardWalletCards;
