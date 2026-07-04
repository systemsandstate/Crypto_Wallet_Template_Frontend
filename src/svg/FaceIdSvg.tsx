import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const FaceIdSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M7 3H4v3M4 17v3h3M17 3h3v3M20 17v3h-3"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path d="M9 10h.01M15 10h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path
            d="M9.5 14a3 3 0 0 0 5 0"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default FaceIdSvg;
