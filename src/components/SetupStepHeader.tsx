import { View, Text, StyleSheet } from "react-native";
import React, { useMemo } from "react";

import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { formatMessage } from "../i18n";

type Props = {
    current: number;
    total: number;
    title: string;
    subtitle: string;
};

const SetupStepHeader: React.FC<Props> = ({ current, total, title, subtitle }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                stepPill: {
                    alignSelf: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                stepText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    letterSpacing: 0.3,
                },
                title: {
                    ...FONTS.H2,
                    color: colors.mainDark,
                    marginBottom: 12,
                    textAlign: "center",
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 14 * 1.6,
                    marginBottom: 20,
                    textAlign: "center",
                },
            }),
        [FONTS, colors]
    );

    return (
        <View>
            <View style={styles.stepPill}>
                <Text style={styles.stepText}>
                    {formatMessage(t.ux.setupStepOf, { current: String(current), total: String(total) })}
                </Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
};

export default SetupStepHeader;
