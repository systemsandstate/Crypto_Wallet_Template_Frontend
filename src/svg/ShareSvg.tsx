import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

type Props = {
    color?: string;
    size?: number;
};

const ShareSvg: React.FC<Props> = ({ color = "#4C4C60", size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={1.5} />
        <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={1.5} />
        <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={1.5} />
        <Path
            d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);

export default ShareSvg;
