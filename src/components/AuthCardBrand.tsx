import { View, StyleSheet } from "react-native";
import React, { memo } from "react";

import KivoLogo from "./KivoLogo";

type Props = {
    size?: "md" | "lg";
};

const AuthCardBrand: React.FC<Props> = ({ size = "lg" }) => (
    <View style={styles.wrap}>
        <KivoLogo size={size} />
    </View>
);

const styles = StyleSheet.create({
    wrap: {
        alignItems: "center",
        marginBottom: 10,
    },
});

export default memo(AuthCardBrand);
