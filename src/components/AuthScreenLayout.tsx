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
                    paddingVertical: 20,
                },
                centeredBody: {
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                },
                card: {
                    width: "100%",
                    backgroundColor: colors.white,
                    borderRadius: 20,
                    paddingVertical: 28,
                    ...(Platform.OS === "android"
                        ? { elevation: 8 }
                        : Platform.OS === "web"
                          ? ({
                                boxShadow: "0 12px 40px rgba(6, 38, 100, 0.12)",
                            } as object)
                          : {
                                shadowColor: "#062664",
                                shadowOffset: { width: 0, height: 12 },
                                shadowOpacity: 0.14,
                                shadowRadius: 28,
                            }),
                },
            }),
        [colors]
    );

    const card = (
        <View
            style={[
                styles.card,
                { maxWidth: authCardMaxWidth, paddingHorizontal: isCompact ? 20 : 24 },
                cardStyle,
            ]}
        >
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
