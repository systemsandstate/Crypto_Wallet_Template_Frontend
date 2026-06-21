import * as React from "react";
import { Image } from "react-native";

const UsdtMarkSvg: React.FC<{ size?: number }> = ({ size = 28 }) => (
    <Image
        source={require("../assets/usdt-logo.png")}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
    />
);

export default UsdtMarkSvg;
