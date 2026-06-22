import { View, Text, Image, StyleSheet } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { svg } from "../svg";
import { theme } from "../constants";
import { DEFAULT_LOCALE, getDictionary, type AppLocale } from "../i18n";

type Props = {
    locale?: AppLocale;
    showSpinner?: boolean;
};

const SplashScreen: React.FC<Props> = ({ locale = DEFAULT_LOCALE, showSpinner = false }) => {
    const t = getDictionary(locale);

    return (
        <View style={styles.root}>
            <Image
                source={require("../assets/bg-01.png")}
                style={styles.background}
                resizeMode="cover"
            />
            <View style={styles.overlay} />
            <SafeAreaView style={styles.content}>
                <View style={styles.logoWrap}>
                    <svg.LogoSvg />
                </View>
                <Text style={styles.title}>{t.splash.title}</Text>
                <Text style={styles.subtitle}>{t.splash.subtitle}</Text>
                {showSpinner ? (
                    <View style={styles.spinnerPlaceholder} />
                ) : null}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.COLORS.mainDark,
    },
    background: {
        ...StyleSheet.absoluteFill,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(27, 29, 77, 0.25)",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    logoWrap: {
        marginBottom: 28,
        transform: [{ scale: 1.2 }],
    },
    title: {
        ...theme.FONTS.H2,
        color: theme.COLORS.white,
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 16,
        lineHeight: 16 * 1.6,
        color: "rgba(255, 255, 255, 0.9)",
        textAlign: "center",
    },
    spinnerPlaceholder: {
        marginTop: 48,
        height: 36,
    },
});

export default SplashScreen;
