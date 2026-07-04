import { View, StyleSheet, Platform } from "react-native";
import React from "react";

import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTheme } from "../hooks/useTheme";

type Props = {
    children: React.ReactNode;
};

/** Responsive app column on web — stretches with viewport, centered with side margins. */
const AppShell: React.FC<Props> = ({ children }) => {
    const { centerAppOnWeb, appMaxWidth, width } = useResponsiveLayout();
    const { colors } = useTheme();

    if (!centerAppOnWeb || !appMaxWidth) {
        return <View style={styles.flex}>{children}</View>;
    }

    const sidePad = Math.max(16, Math.round((width - appMaxWidth) / 2));

    return (
        <View
            style={[
                styles.wideRoot,
                {
                    backgroundColor: Platform.OS === "web" ? colors.shellBg : colors.bgColor,
                    paddingHorizontal: Platform.OS === "web" ? Math.min(sidePad, 48) : 0,
                },
            ]}
        >
            <View
                style={[
                    styles.flex,
                    styles.wideColumn,
                    {
                        maxWidth: appMaxWidth,
                        width: "100%",
                    },
                ]}
            >
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
    },
    wideColumn: {
        overflow: "hidden",
        ...(Platform.OS === "web"
            ? ({
                  boxShadow: "0 0 48px rgba(6, 38, 100, 0.12)",
              } as object)
            : {}),
    },
});

export default AppShell;
