import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

/** Activity list — reads clearly at tab-bar size (unlike a thin clock ring). */
const HistorySvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="5" cy="7" r="1.5" fill={color} />
        <Circle cx="5" cy="12" r="1.5" fill={color} />
        <Circle cx="5" cy="17" r="1.5" fill={color} />
        <Path
            d="M9 7h10"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
        <Path
            d="M9 12h10"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
        <Path
            d="M9 17h7"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default HistorySvg;
