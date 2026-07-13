import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { ACTION_ICON_SIZE, ACTION_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

/** Receive / get paid — arrow into tray, reads clearly at small size. */
const ReceiveSvg: React.FC<Props> = ({ color = "#2563EB", size = ACTION_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 4v11"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
        />
        <Path
            d="M8 11l4 4 4-4"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M5 20h14"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default ReceiveSvg;
