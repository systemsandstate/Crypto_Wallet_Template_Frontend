import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { ACTION_ICON_SIZE } from "../constants/menuIcon";

const WITHDRAW_ICON = require("../assets/icons/withdraw.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const WithdrawSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE, style }) => (
    <Image
        source={WITHDRAW_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default WithdrawSvg;
