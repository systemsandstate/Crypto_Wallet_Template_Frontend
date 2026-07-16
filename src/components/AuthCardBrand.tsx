import { View, StyleSheet } from "react-native";
import React, { memo } from "react";

import KivooLogo from "./KivooLogo";

type Props = {
    size?: "md" | "lg";
};

const AuthCardBrand: React.FC<Props> = ({ size = "lg" }) => (
    <View style={styles.wrap}>
        <KivooLogo size={size} />
    </View>
);

const styles = StyleSheet.create({
    wrap: {
        alignItems: "center",
        marginBottom: 10,
    },
});

export default memo(AuthCardBrand);
