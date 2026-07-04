import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const LanguageSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={MENU_ICON_STROKE} />
        <Path d="M3 12h18" stroke={color} strokeWidth={MENU_ICON_STROKE} strokeLinecap="round" />
        <Path
            d="M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default LanguageSvg;
