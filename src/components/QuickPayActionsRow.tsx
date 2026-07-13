import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useTheme } from "../hooks/useTheme";

type QuickPayAction = {
    key: string;
    title: string;
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
};

type Props = {
    actions: QuickPayAction[];
};

const QuickPayActionsRow: React.FC<Props> = ({ actions }) => {
    const { colors, FONTS } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    gap: 10,
                },
                action: {
                    flex: 1,
                    minWidth: 0,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                iconCircle: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.selectedBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                },
                textWrap: {
                    flex: 1,
                    minWidth: 0,
                },
                title: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.mainDark,
                },
            }),
        [FONTS, colors]
    );

    return (
        <View style={styles.row}>
            {actions?.length ? actions.map((action) => (
                <TouchableOpacity
                    key={action.key}
                    style={styles.action}
                    activeOpacity={0.85}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.accessibilityLabel}
                >
                    <View style={styles.iconCircle}>{action.icon}</View>
                    <View style={styles.textWrap}>
                        <Text style={styles.title} numberOfLines={2}>
                            {action.title}
                        </Text>
                    </View>
                </TouchableOpacity>
            )) : null}
        </View>
    );
};

export default QuickPayActionsRow;
