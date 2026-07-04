import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../hooks/useTheme";
import HeaderMenuButton from "./HeaderMenuButton";

type Props = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    paddingBottom?: number;
    showSettings?: boolean;
};

const MerchantTabHeader: React.FC<Props> = ({
    eyebrow,
    title,
    subtitle,
    children,
    paddingBottom = 20,
    showSettings = true,
}) => {
    const { colors, FONTS } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    backgroundColor: colors.headerBg,
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
                menuSlot: {
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                },
                textBlock: {
                    flex: 1,
                    paddingRight: 12,
                },
                eyebrow: {
                    ...FONTS.Mulish_400Regular,
                    color: colors.headerMuted,
                    fontSize: 14,
                    marginBottom: 4,
                },
                title: {
                    ...FONTS.H3,
                    color: "#FFFFFF",
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    color: colors.headerMuted,
                    fontSize: 14,
                    marginTop: 6,
                },
                children: {
                    marginTop: 16,
                },
            }),
        [colors, FONTS]
    );

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
                        <View style={styles.menuSlot}>
                            {showSettings ? <HeaderMenuButton /> : null}
                        </View>
                    </View>
                    {children ? <View style={styles.children}>{children}</View> : null}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default MerchantTabHeader;
