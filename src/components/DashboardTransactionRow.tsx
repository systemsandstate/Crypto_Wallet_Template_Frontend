import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";

type Props = {
    name: string;
    timeLabel: string;
    amountLabel: string;
    isCredit: boolean;
    onPress: () => void;
};

const avatarColor = (seed: string) => {
    const palette = ["#2563EB", "#059669", "#7C3AED", "#D97706", "#DB2777", "#0891B2"];
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
};

const DashboardTransactionRow: React.FC<Props> = ({
    name,
    timeLabel,
    amountLabel,
    isCredit,
    onPress,
}) => {
    const { colors, FONTS } = useTheme();
    const initial = (name.trim()[0] || "?").toUpperCase();
    const bg = avatarColor(name);
    const avatarSize = DENSITY.transactionAvatar;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: DENSITY.listRowPaddingV,
                },
                avatar: {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: bg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                },
                avatarText: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 13,
                    color: colors.pureWhite,
                },
                meta: {
                    flex: 1,
                    minWidth: 0,
                },
                name: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    marginBottom: 1,
                },
                time: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                },
                amount: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 13,
                    color: isCredit ? colors.green : colors.red,
                    flexShrink: 0,
                    marginLeft: 6,
                },
            }),
        [FONTS, avatarSize, bg, colors, isCredit]
    );

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityRole="button"
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={1}>
                    {name}
                </Text>
                <Text style={styles.time}>{timeLabel}</Text>
            </View>
            <Text style={styles.amount}>{amountLabel}</Text>
        </TouchableOpacity>
    );
};

export default DashboardTransactionRow;
