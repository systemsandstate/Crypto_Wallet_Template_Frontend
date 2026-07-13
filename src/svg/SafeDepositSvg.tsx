import * as React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const SafeDepositSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
            x="4"
            y="8"
            width="16"
            height="12"
            rx="2"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
        />
        <Path
            d="M8 8V6a4 4 0 0 1 8 0v2M12 14v2"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
        <Circle cx="12" cy="14" r="1.5" fill={color} />
    </Svg>
);

export default SafeDepositSvg;
