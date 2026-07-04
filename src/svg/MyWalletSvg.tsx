import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

const WALLET_ICON = require("../assets/icons/wallet.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const MyWalletSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE, style }) => (
    <Image
        source={WALLET_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default MyWalletSvg;
