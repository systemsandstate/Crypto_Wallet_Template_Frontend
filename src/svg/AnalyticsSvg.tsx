import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const STROKE = 2.5;

const AnalyticsSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M6 15.5v3"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
        />
        <Path
            d="M12 6.5v12"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
        />
        <Path
            d="M18 11.5v8H4.5"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default AnalyticsSvg;
