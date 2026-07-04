import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

const ADDRESS_BOOK_ICON = require("../assets/icons/address-book.png");

type Props = {
    color?: string;
    size?: number;
    style?: StyleProp<ImageStyle>;
};

const AddressBookSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE, style }) => (
    <Image
        source={ADDRESS_BOOK_ICON}
        style={[{ width: size, height: size, tintColor: color }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
    />
);

export default AddressBookSvg;
