import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const HelpQuestionSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={MENU_ICON_STROKE} />
        <Path
            d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 2-2.5 2-2.5 4"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
        <Circle cx="12" cy="17" r="0.75" fill={color} />
    </Svg>
);

export default HelpQuestionSvg;
