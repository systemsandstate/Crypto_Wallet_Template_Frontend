import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { ACTION_ICON_SIZE } from "../constants/menuIcon";

const TRANSFER_ICON = require("../assets/icons/transfer.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const TransferSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE, style }) => (
    <Image
        source={TRANSFER_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default TransferSvg;
