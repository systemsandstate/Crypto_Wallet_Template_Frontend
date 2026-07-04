import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useTheme } from "../hooks/useTheme";

export type WalletQuickAction = {
    key: string;
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel?: string;
};

type Props = {
    actions: WalletQuickAction[];
    variant?: "onDark" | "default";
};

const ICON_SIZE = 52;

const WalletQuickActions: React.FC<Props> = ({ actions, variant = "onDark" }) => {
    const { colors, FONTS, isDark } = useTheme();
    const onDark = variant === "onDark";

    const styles = useMemo(
        () =>
            StyleSheet.create({
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
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    borderRadius: ICON_SIZE / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: onDark
                        ? "rgba(255,255,255,0.1)"
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "#2E2E38",
                    marginBottom: 8,
                },
                label: {
                    ...FONTS.Mulish_500Medium,
                    fontSize: 11,
                    lineHeight: 14,
                    textAlign: "center",
                    color: onDark ? "rgba(255,255,255,0.88)" : colors.mainDark,
                },
            }),
        [FONTS, colors.mainDark, isDark, onDark]
    );

    return (
        <View style={styles.row}>
            {actions.map((action) => (
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
    );
};

export default WalletQuickActions;
