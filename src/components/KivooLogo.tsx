import { Image, ImageStyle, StyleProp } from "react-native";
import React from "react";

const LOGO = require("../assets/logo.png");
const LOGO_HEADER = require("../assets/logo-header.png");

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "header";

/** Header uses a cropped asset so the mark sits flush left (no empty PNG padding). */
const SIZES: Record<Size, { width: number; height: number; cropped?: boolean }> = {
    xs: { width: 64, height: 26 },
    sm: { width: 92, height: 40 },
    md: { width: 120, height: 48 },
    lg: { width: 148, height: 60 },
    xl: { width: 196, height: 78 },
    header: { width: 56, height: 72, cropped: true },
};

type Props = {
    size?: Size;
    style?: StyleProp<ImageStyle>;
};

const KivooLogo: React.FC<Props> = ({ size = "md", style }) => {
    const dims = SIZES[size];
    return (
        <Image
            source={dims.cropped ? LOGO_HEADER : LOGO}
            style={[{ width: dims.width, height: dims.height }, style]}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Kivoo"
        />
    );
};

export default KivooLogo;
