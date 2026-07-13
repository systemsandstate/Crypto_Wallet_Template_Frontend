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

const CARD_THEMES: Record<
    UsdtNetwork,
    { gradient: string; accent: string; titleKey: "bep20Card" | "trc20Card" | "erc20Card" }
> = {
    BEP20: { gradient: "#C9940A", accent: "#F0B90B", titleKey: "bep20Card" },
    TRC20: { gradient: "#C4001D", accent: "#EF0027", titleKey: "trc20Card" },
    ERC20: { gradient: "#3D4FBD", accent: "#627EEA", titleKey: "erc20Card" },
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
    const { colors, FONTS } = useTheme();
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

    const styles = useMemo(
        () =>
            StyleSheet.create({
                sectionTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                    marginBottom: 8,
                },
                scroll: {
                    marginHorizontal: -DENSITY.pagePaddingH,
                },
                scrollContent: {
                    paddingHorizontal: DENSITY.pagePaddingH,
                    gap: 8,
                },
                card: {
                    width: DENSITY.walletCardW,
                    height: DENSITY.walletCardH,
                    borderRadius: 12,
                    padding: 12,
                    justifyContent: "space-between",
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } as object)
                        : { elevation: 2 }),
                },
                stackCardInner: {
                    width: "100%",
                    minHeight: 72,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" } as object)
                        : { elevation: 2 }),
                },
                stackLeft: {
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    minWidth: 0,
                    gap: 12,
                },
                stackMeta: {
                    flex: 1,
                    minWidth: 0,
                },
                stackCardTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 14,
                    color: colors.pureWhite,
                },
                stackCardSub: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 2,
                },
                stackAmount: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 16,
                    color: colors.pureWhite,
                    flexShrink: 0,
                    marginLeft: 10,
                },
                stackChevron: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 20,
                    color: "rgba(255,255,255,0.7)",
                    marginLeft: 6,
                },
                cardTop: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                },
                cardTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 12,
                    color: colors.pureWhite,
                },
                balance: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: colors.pureWhite,
                    marginTop: 2,
                },
                balanceSub: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 1,
                },
                chip: {
                    width: 22,
                    height: 16,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.35)",
                },
                stackList: {
                    gap: 10,
                },
                stackCard: {
                    width: "100%",
                },
            }),
        [FONTS, colors]
    );

    const resolvedTitle = sectionTitle ?? t.dashboard.yourCards;

    const renderCard = (network: UsdtNetwork) => {
        const theme = CARD_THEMES[network];
        const raw = balances[network];
        const amount = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
        const formatted = formatUsdtAmount(amount, dateLocale);

        return (
            <TouchableOpacity
                key={network}
                activeOpacity={0.85}
                onPress={() => onCardPress(network)}
                accessibilityRole="button"
                accessibilityLabel={`${t.dashboard[theme.titleKey]} ${formatted} USDT`}
                style={variant === "stack" ? styles.stackCard : undefined}
            >
                {variant === "stack" ? (
                    <View style={[styles.stackCardInner, { backgroundColor: theme.gradient }]}>
                        <View style={styles.stackLeft}>
                            <NetworkLogo network={network} size={28} />
                            <View style={styles.stackMeta}>
                                <Text style={styles.stackCardTitle} numberOfLines={1}>
                                    {t.dashboard[theme.titleKey]}
                                </Text>
                                <Text style={styles.stackCardSub}>USDT</Text>
                            </View>
                        </View>
                        <Text style={styles.stackAmount}>${formatted}</Text>
                        <Text style={styles.stackChevron}>›</Text>
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: theme.gradient }]}>
                        <View style={styles.cardTop}>
                            <NetworkLogo network={network} size={20} />
                            <View style={styles.chip} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>{t.dashboard[theme.titleKey]}</Text>
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
