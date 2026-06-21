import * as React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
    color?: string;
};

const LogOutSvg: React.FC<Props> = ({ color = "#FF5887" }) => (
    <Svg width={16} height={16} fill="none">
        <Path
            d="M10.667 14.333 14 11l-3.333-3.333M14 11H6M6 17H3.333A1.334 1.334 0 0 1 2 15.667V6.333A1.333 1.333 0 0 1 3.333 5H6"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default LogOutSvg;
