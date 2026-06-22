import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import LanguageTrigger from "./LanguageTrigger";

type Props = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
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
                    <View style={styles.headerRow}>
                        <View style={styles.textBlock}>
                            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                            <Text style={styles.title}>{title}</Text>
                            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                        </View>
                        <LanguageTrigger tone="on-dark" />
                    </View>
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
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    textBlock: {
        flex: 1,
        paddingRight: 12,
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
