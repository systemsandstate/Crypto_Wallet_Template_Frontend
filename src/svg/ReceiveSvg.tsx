import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { ACTION_ICON_SIZE, ACTION_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const ReceiveSvg: React.FC<Props> = ({ color = "#FFFFFF", size = ACTION_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 5v14M12 19l-6-6M12 19l6-6"
            stroke={color}
            strokeWidth={ACTION_ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default ReceiveSvg;
