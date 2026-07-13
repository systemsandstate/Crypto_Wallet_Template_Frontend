import React from "react";
import { BookUser } from "lucide-react-native";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const AddressBookSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <BookUser color={color} size={size} strokeWidth={2} absoluteStrokeWidth />
);

export default AddressBookSvg;
