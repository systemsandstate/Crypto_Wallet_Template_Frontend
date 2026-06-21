import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";

type Props = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    /** Extra space below title for overlapping cards (e.g. Home balance card) */
    paddingBottom?: number;
};

const MerchantTabHeader: React.FC<Props> = ({
    eyebrow,
    title,
    subtitle,
    children,
    paddingBottom = 20,
}) => {
    return (
        <View style={[styles.wrap, { paddingBottom }]}>
            <SafeAreaView edges={["top"]}>
                <View style={styles.inner}>
                    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    {children ? <View style={styles.children}>{children}</View> : null}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: theme.COLORS.mainDark,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    inner: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    eyebrow: {
        ...theme.FONTS.Mulish_400Regular,
        color: "#CED6E1",
        fontSize: 14,
        marginBottom: 4,
    },
    title: {
        ...theme.FONTS.H3,
        color: theme.COLORS.white,
    },
    subtitle: {
        ...theme.FONTS.Mulish_400Regular,
        color: "#CED6E1",
        fontSize: 14,
        marginTop: 6,
    },
    children: {
        marginTop: 16,
    },
});

export default MerchantTabHeader;
