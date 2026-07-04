import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

const HISTORY_ICON = require("../assets/icons/history.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const HistorySvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE, style }) => (
    <Image
        source={HISTORY_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default HistorySvg;
