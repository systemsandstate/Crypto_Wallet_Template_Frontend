import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { svg } from "../svg";
import { theme } from "../constants";

const SplashScreen: React.FC = () => {
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
                <Text style={styles.title}>Merchant Payments</Text>
                <Text style={styles.subtitle}>Accept USDT on TRON, Ethereum, BNB, Solana & Polygon</Text>
                <ActivityIndicator size="large" color={theme.COLORS.white} style={{ marginTop: 48 }} />
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
        width: theme.SIZES.width,
        height: theme.SIZES.height,
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
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
    },
});

export default SplashScreen;
