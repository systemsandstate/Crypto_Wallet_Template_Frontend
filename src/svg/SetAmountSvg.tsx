import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";

type Props = {
    color?: string;
    size?: number;
};

const SetAmountSvg: React.FC<Props> = ({ color = "#4C4C60", size = 22 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
        <Path
            d="M8 12h8M12 8v8"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
        />
    </Svg>
);

export default SetAmountSvg;
