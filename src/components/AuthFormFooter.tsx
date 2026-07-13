import { View, StyleSheet } from "react-native";
import React, { memo, useMemo } from "react";

import { useTheme } from "../hooks/useTheme";

type Props = {
    children: React.ReactNode;
};

const AuthFormFooter: React.FC<Props> = ({ children }) => {
    const { colors } = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    marginTop: 4,
                },
                divider: {
                    height: 1,
                    backgroundColor: colors.border,
                    marginBottom: 16,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                },
            }),
        [colors]
    );

    return (
        <View style={styles.wrap}>
            <View style={styles.divider} />
            <View style={styles.row}>{children}</View>
        </View>
    );
};

export default memo(AuthFormFooter);
