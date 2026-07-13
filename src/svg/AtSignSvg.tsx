import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";

import { ACTION_ICON_SIZE, ACTION_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const AtSignSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={ACTION_ICON_STROKE} />
        <Path
            d="M16 8v5a3 3 0 1 1-6 0V8"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M12 16v2"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default AtSignSvg;
