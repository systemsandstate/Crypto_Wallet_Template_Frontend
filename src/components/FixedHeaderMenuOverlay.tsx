import { View, StyleSheet, Platform } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HeaderMenuButton from "./HeaderMenuButton";

/** Settings gear pinned to the top-right while tab content scrolls. */
const FixedHeaderMenuOverlay: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[styles.wrap, { top: insets.top + 8 }]}
            pointerEvents="box-none"
        >
            <HeaderMenuButton />
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        position: Platform.OS === "web" ? ("fixed" as "absolute") : "absolute",
        right: 20,
        zIndex: 10000,
        elevation: 10000,
    },
});

export default FixedHeaderMenuOverlay;
