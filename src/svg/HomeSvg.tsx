import * as React from "react";
import Svg, { Path } from "react-native-svg";

import { MENU_ICON_SIZE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

/** Static paths traced from the home-2 Lottie icon (24×24). */
const ROOF_PATH = "M12 4.789 20 12h3L12 2.1 1 12h3l8-7.211Z";
const WALLS_PATH = "M19 9.709V20.001H14V14.001H10V20.001H5V9.709";

const HomeSvg: React.FC<Props> = ({ color = "#4C4C60", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={ROOF_PATH} fill={color} />
        <Path
            d={WALLS_PATH}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default HomeSvg;
