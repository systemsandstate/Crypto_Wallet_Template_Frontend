import {
    View,
    StyleSheet,
    ViewStyle,
    Platform,
    ScrollView,
    KeyboardAvoidingView,
} from "react-native";
import React, { memo, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";

type Props = {
    header?: React.ReactNode;
    children: React.ReactNode;
    cardStyle?: ViewStyle;
};

const AuthScreenLayout: React.FC<Props> = ({ header, children, cardStyle }) => {
    const { authCardMaxWidth, horizontalPadding, isCompact } = useResponsiveLayout();
    const { colors } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                flex: {
                    flex: 1,
                    minHeight: 0,
                },
                safe: {
                    flex: 1,
                },
                scrollContent: {
                    flexGrow: 1,
                    justifyContent: "center",
                    paddingVertical: 16,
                },
                centeredBody: {
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                },
                card: {
                    width: "100%",
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    paddingVertical: 22,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                    ...(Platform.OS === "android"
                        ? { elevation: 2 }
                        : Platform.OS === "web"
                          ? ({
                                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                            } as object)
                          : {
                                shadowColor: "#000000",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.06,
                                shadowRadius: 12,
                            }),
                },
                accent: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: colors.accentBlue,
                },
            }),
        [colors]
    );

    const card = (
        <View
            style={[
                styles.card,
                { maxWidth: authCardMaxWidth, paddingHorizontal: isCompact ? 18 : 22 },
                cardStyle,
            ]}
        >
            <View style={styles.accent} />
            {children}
        </View>
    );

    const bodyContent = (
        <View style={[styles.centeredBody, { paddingHorizontal: horizontalPadding }]}>
            {card}
        </View>
    );

    const scrollBody = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
            style={styles.flex}
        >
            {bodyContent}
        </ScrollView>
    );

    return (
        <View style={styles.root}>
            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                {header}
                {Platform.OS === "ios" ? (
                    <KeyboardAvoidingView style={styles.flex} behavior="padding">
                        {scrollBody}
                    </KeyboardAvoidingView>
                ) : (
                    scrollBody
                )}
            </SafeAreaView>
        </View>
    );
};

export default memo(AuthScreenLayout);
