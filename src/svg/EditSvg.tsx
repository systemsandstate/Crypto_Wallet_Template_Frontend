import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const EditSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M4 20h4l9.5-9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M13.5 6.5l4 4"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default EditSvg;
