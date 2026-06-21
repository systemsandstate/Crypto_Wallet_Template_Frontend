import { View, Image, StyleSheet, ViewStyle } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";

type Props = {
    header?: React.ReactNode;
    children: React.ReactNode;
    cardStyle?: ViewStyle;
};

const AuthScreenLayout: React.FC<Props> = ({ header, children, cardStyle }) => {
    return (
        <View style={styles.root}>
            <Image
                source={require("../assets/bg-02.png")}
                style={styles.background}
                resizeMode="cover"
            />
            <View style={styles.overlay} />
            <SafeAreaView style={styles.safe}>
                {header}
                <View style={[styles.card, cardStyle]}>{children}</View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.COLORS.bgColor,
    },
    background: {
        position: "absolute",
        top: 0,
        left: 0,
        width: theme.SIZES.width,
        height: theme.SIZES.height,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(237, 240, 242, 0.35)",
    },
    safe: {
        flex: 1,
    },
    card: {
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 24,
        backgroundColor: theme.COLORS.white,
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 28,
        shadowColor: "#062664",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 6,
    },
});

export default AuthScreenLayout;
