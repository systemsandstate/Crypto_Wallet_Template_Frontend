import React from "react";
import { SlidersHorizontal } from "lucide-react-native";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

/** Sliders / dials — clear settings metaphor, sharp at header sizes. */
const SettingsGearSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <SlidersHorizontal color={color} size={size} strokeWidth={2} absoluteStrokeWidth />
);

export default SettingsGearSvg;
