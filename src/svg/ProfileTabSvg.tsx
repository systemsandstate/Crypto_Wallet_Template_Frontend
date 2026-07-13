import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const ProfileTabSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={MENU_ICON_STROKE} />
        <Path
            d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default ProfileTabSvg;
