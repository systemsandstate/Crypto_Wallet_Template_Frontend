import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";

export type WalletQuickAction = {
    key: string;
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel?: string;
};

type Props = {
    actions: WalletQuickAction[];
    title?: string;
    variant?: "default" | "banking";
};

const WalletQuickActions: React.FC<Props> = ({ actions, title, variant = "banking" }) => {
    const { colors, FONTS } = useTheme();
    const isBanking = variant === "banking";

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    gap: 8,
                },
                title: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 4,
                },
                action: {
                    flex: 1,
                    minWidth: 0,
                    alignItems: "center",
                },
                iconCircle: {
                    width: DENSITY.quickActionCircle,
                    height: DENSITY.quickActionCircle,
                    borderRadius: DENSITY.quickActionCircle / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 5,
                    backgroundColor: isBanking ? colors.white : colors.accentBlue,
                    borderWidth: isBanking ? 1 : 0,
                    borderColor: isBanking ? colors.border : colors.transparent,
                },
                label: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: DENSITY.quickActionLabel,
                    lineHeight: 12,
                    textAlign: "center",
                    color: colors.mainDark,
                },
            }),
        [FONTS, colors, isBanking]
    );

    return (
        <View style={styles.wrap}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <View style={styles.row}>
                {(actions ?? []).map((action) => (
                    <TouchableOpacity
                        key={action.key}
                        style={styles.action}
                        onPress={action.onPress}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={action.accessibilityLabel || action.label}
                    >
                        <View style={styles.iconCircle}>{action.icon}</View>
                        <Text style={styles.label} numberOfLines={2}>
                            {action.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default WalletQuickActions;
