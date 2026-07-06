import { View, StyleSheet } from "react-native";
import React from "react";

import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTheme } from "../hooks/useTheme";

type Props = {
    children: React.ReactNode;
};

/** Responsive app column on web — same bg as mobile, centered on wide viewports. */
const AppShell: React.FC<Props> = ({ children }) => {
    const { centerAppOnWeb, appMaxWidth, width } = useResponsiveLayout();
    const { colors } = useTheme();

    const flexRoot = [styles.flex, { backgroundColor: colors.bgColor }];

    if (!centerAppOnWeb || !appMaxWidth) {
        return <View style={flexRoot}>{children}</View>;
    }

    const sidePad = Math.max(16, Math.round((width - appMaxWidth) / 2));

    return (
        <View
            style={[
                styles.wideRoot,
                {
                    backgroundColor: colors.bgColor,
                    paddingHorizontal: Math.min(sidePad, 48),
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
    },
});

export default AppShell;
