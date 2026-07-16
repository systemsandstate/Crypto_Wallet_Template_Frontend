import { View, Text, StyleSheet } from "react-native";
import React, { memo, useMemo } from "react";

import KivooLogo from "./KivooLogo";
import { useTheme } from "../hooks/useTheme";

type Props = {
    title?: string;
    subtitle?: string;
    size?: "md" | "lg" | "xl";
};

const AuthFormHeader: React.FC<Props> = ({ title, subtitle, size = "xl" }) => {
    const { colors, FONTS } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    alignItems: "center",
                    marginBottom: 20,
                },
                logoWrap: {
                    marginBottom: title || subtitle ? 16 : 0,
                },
                title: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 17,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: subtitle ? 6 : 0,
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    lineHeight: 19,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    maxWidth: 300,
                },
                divider: {
                    width: "100%",
                    height: 1,
                    backgroundColor: colors.border,
                    marginTop: 18,
                },
            }),
        [colors, FONTS, subtitle, title]
    );

    return (
        <View style={styles.wrap}>
            <View style={styles.logoWrap}>
                <KivooLogo size={size} />
            </View>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.divider} />
        </View>
    );
};

export default memo(AuthFormHeader);
