import * as React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const MyWalletSvg: React.FC<Props> = ({ color = "#6B7280", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
            x="3"
            y="6"
            width="18"
            height="13"
            rx="2"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
        />
        <Path
            d="M3 10h18M16 14h2"
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            strokeLinecap="round"
        />
    </Svg>
);

export default MyWalletSvg;
