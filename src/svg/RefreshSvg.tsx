import * as React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
    color?: string;
    size?: number;
};

const RefreshSvg: React.FC<Props> = ({ color = "rgba(255,255,255,0.72)", size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M20 12a8 8 0 1 1-2.34-5.66"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M20 4v4h-4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default RefreshSvg;
