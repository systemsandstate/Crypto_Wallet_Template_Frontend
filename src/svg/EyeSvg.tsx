import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const EyeSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default EyeSvg;
