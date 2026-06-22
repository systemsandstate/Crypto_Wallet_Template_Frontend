import { View, StyleSheet, Platform } from "react-native";
import React from "react";

import { theme } from "../constants";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

type Props = {
    children: React.ReactNode;
};

/** Centers the mobile app column on wide web viewports. */
const AppShell: React.FC<Props> = ({ children }) => {
    const { centerAppOnWeb, appMaxWidth } = useResponsiveLayout();

    if (!centerAppOnWeb) {
        return <View style={styles.flex}>{children}</View>;
    }

    return (
        <View style={styles.wideRoot}>
            <View style={[styles.flex, styles.wideColumn, { maxWidth: appMaxWidth }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    wideRoot: {
        flex: 1,
        alignItems: "center",
        backgroundColor: Platform.OS === "web" ? "#D8DEE8" : theme.COLORS.bgColor,
    },
    wideColumn: {
        width: "100%",
        overflow: "hidden",
        ...(Platform.OS === "web"
            ? ({
                  boxShadow: "0 0 48px rgba(6, 38, 100, 0.12)",
              } as object)
            : {}),
    },
});

export default AppShell;
