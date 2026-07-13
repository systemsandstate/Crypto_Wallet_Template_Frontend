import { Image, ImageStyle, StyleProp } from "react-native";
import React from "react";

const LOGO = require("../assets/logo.png");

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { width: number; height: number }> = {
    sm: { width: 88, height: 36 },
    md: { width: 120, height: 48 },
    lg: { width: 148, height: 60 },
    xl: { width: 196, height: 78 },
};

type Props = {
    size?: Size;
    style?: StyleProp<ImageStyle>;
};

const KivoLogo: React.FC<Props> = ({ size = "md", style }) => {
    const dims = SIZES[size];
    return (
        <Image
            source={LOGO}
            style={[{ width: dims.width, height: dims.height }, style]}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Kivo"
        />
    );
};

export default KivoLogo;
