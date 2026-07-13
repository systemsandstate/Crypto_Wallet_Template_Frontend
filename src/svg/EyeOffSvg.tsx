import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const EyeOffSvg: React.FC<Props> = ({ color = "#6B7280", size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M9.88 9.88a3 3 0 1 0 4.24 4.24"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M2 2l20 20"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default EyeOffSvg;
