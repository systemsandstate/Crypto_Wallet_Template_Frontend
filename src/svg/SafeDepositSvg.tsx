import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { ACTION_ICON_SIZE } from "../constants/menuIcon";

const DEPOSIT_ICON = require("../assets/icons/deposit.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const SafeDepositSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE, style }) => (
    <Image
        source={DEPOSIT_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default SafeDepositSvg;
