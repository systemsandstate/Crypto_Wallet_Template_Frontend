import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";
import HeaderMenuButton from "./HeaderMenuButton";

type Props = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    subtitleSecondLine?: string;
    subtitleAccessory?: React.ReactNode;
    leading?: React.ReactNode;
    topRow?: React.ReactNode;
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
    leading,
    headerTrailing,
    children,
    paddingBottom: paddingBottomProp,
    showSettings = true,
}) => {
    const { colors, FONTS } = useTheme();
    const paddingBottom = paddingBottomProp ?? (leading ? 8 : 10);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    backgroundColor: colors.headerBg,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                inner: {
                    paddingHorizontal: DENSITY.pagePaddingH,
                    paddingTop: 6,
                },
                topRow: {
                    marginBottom: 6,
                },
                headerRow: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                },
                leading: {
                    marginRight: 10,
                    flexShrink: 0,
                },
                headerRowWithLeading: {
                    alignItems: "center",
                },
                trailingRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 2,
                    flexShrink: 0,
                },
                menuSlot: {
                    width: DENSITY.iconButton,
                    height: DENSITY.iconButton,
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
                    fontSize: 12,
                    marginBottom: 1,
                },
                title: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 18,
                    lineHeight: 22,
                    color: colors.mainDark,
                },
                subtitleRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 4,
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
                    fontSize: 12,
                    lineHeight: 16,
                },
                subtitleAccessory: {
                    flexShrink: 0,
                    marginLeft: "auto",
                },
                children: {
                    marginTop: 14,
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
                    <View style={[styles.headerRow, leading ? styles.headerRowWithLeading : null]}>
                        {leading ? <View style={styles.leading}>{leading}</View> : null}
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
                                        <HeaderMenuButton variant="default" triggerStyle="header" />
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
