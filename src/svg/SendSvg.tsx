import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { ACTION_ICON_SIZE, ACTION_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const SendSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 19V5M12 5l-6 6M12 5l6 6"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default SendSvg;
