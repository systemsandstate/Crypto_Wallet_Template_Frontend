import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../hooks/useTheme";
import HeaderMenuButton from "./HeaderMenuButton";

type Props = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Optional second line under subtitle (e.g. "Multi-chain"). */
    subtitleSecondLine?: string;
    /** Renders on the right of the subtitle block. */
    subtitleAccessory?: React.ReactNode;
    /** Optional top row inside the header (e.g. balance + settings). */
    topRow?: React.ReactNode;
    /** Optional control(s) to the left of the settings gear. */
    headerTrailing?: React.ReactNode;
    children?: React.ReactNode;
    paddingBottom?: number;
    showSettings?: boolean;
};

const MerchantTabHeader: React.FC<Props> = ({
    eyebrow,
    title,
    subtitle,
    subtitleSecondLine,
    subtitleAccessory,
    topRow,
    headerTrailing,
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
                    overflow: "visible",
                },
                inner: {
                    paddingHorizontal: 20,
                    paddingTop: 8,
                },
                topRow: {
                    marginBottom: 10,
                },
                headerRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                },
                trailingRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 2,
                    flexShrink: 0,
                },
                menuSlot: {
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                },
                textBlock: {
                    flex: 1,
                    paddingRight: 12,
                    minWidth: 0,
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
                subtitleRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 6,
                    gap: 10,
                    minWidth: 0,
                },
                subtitleTextCol: {
                    flex: 1,
                    minWidth: 0,
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    color: colors.headerMuted,
                    fontSize: 14,
                    lineHeight: 18,
                },
                subtitleAccessory: {
                    flexShrink: 0,
                    marginLeft: "auto",
                },
                children: {
                    marginTop: 16,
                },
            }),
        [colors, FONTS]
    );

    const hasSubtitle = Boolean(subtitle || subtitleSecondLine);
    const subtitleBlock =
        hasSubtitle || subtitleAccessory ? (
            <View style={styles.subtitleRow}>
                {hasSubtitle ? (
                    <View style={styles.subtitleTextCol}>
                        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                        {subtitleSecondLine ? (
                            <Text style={styles.subtitle}>{subtitleSecondLine}</Text>
                        ) : null}
                    </View>
                ) : (
                    <View style={styles.subtitleTextCol} />
                )}
                {subtitleAccessory ? (
                    <View style={styles.subtitleAccessory}>{subtitleAccessory}</View>
                ) : null}
            </View>
        ) : null;

    return (
        <View style={[styles.wrap, { paddingBottom }]}>
            <SafeAreaView edges={["top"]}>
                <View style={styles.inner}>
                    {topRow ? <View style={styles.topRow}>{topRow}</View> : null}
                    <View style={styles.headerRow}>
                        <View style={styles.textBlock}>
                            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                            <Text style={styles.title}>{title}</Text>
                            {subtitleBlock}
                        </View>
                        {headerTrailing || showSettings ? (
                            <View style={styles.trailingRow}>
                                {headerTrailing}
                                {showSettings ? (
                                    <View style={styles.menuSlot}>
                                        <HeaderMenuButton variant="onHeader" />
                                    </View>
                                ) : null}
                            </View>
                        ) : null}
                    </View>
                    {children ? <View style={styles.children}>{children}</View> : null}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default MerchantTabHeader;
