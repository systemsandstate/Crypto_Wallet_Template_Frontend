import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

const HELP_ICON = require("../assets/icons/help.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const HelpQuestionSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE, style }) => (
    <Image
        source={HELP_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default HelpQuestionSvg;
