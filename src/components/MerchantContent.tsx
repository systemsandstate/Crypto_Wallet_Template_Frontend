import { View, StyleSheet, ViewStyle } from "react-native";
import React from "react";

import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
    fullWidth?: boolean;
};

/** Centers merchant body content and applies consistent horizontal padding. */
const MerchantContent: React.FC<Props> = ({ children, style, fullWidth = false }) => {
    const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();

    return (
        <View
            style={[
                styles.wrap,
                fullWidth
                    ? { paddingHorizontal: horizontalPadding }
                    : { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        width: "100%",
        alignSelf: "center",
    },
});

export default MerchantContent;
