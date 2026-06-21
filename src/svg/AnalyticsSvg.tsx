import * as React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
    color?: string;
};

const AnalyticsSvg: React.FC<Props> = ({ color = "#4C4C60" }) => (
    <Svg width={24} height={24} viewBox="0 0 22 22" fill="none">
        <Path
            d="M4 18V10M9 18V6M14 18V12M19 18V4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
        />
        <Path d="M3 18h17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export default AnalyticsSvg;
