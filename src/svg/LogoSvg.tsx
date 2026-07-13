import * as React from "react";
import { Image } from "react-native";

const LOGO = require("../assets/logo.png");

type Props = {
    width?: number;
    height?: number;
};

const LogoSvg: React.FC<Props> = ({ width = 120, height = 48 }) => (
    <Image
        source={LOGO}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel="Kivo"
    />
);

export default LogoSvg;
