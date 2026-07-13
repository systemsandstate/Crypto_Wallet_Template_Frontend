import * as React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { ACTION_ICON_SIZE, ACTION_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const EmailSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
        />
        <Path
            d="M3 7l9 6 9-6"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default EmailSvg;
