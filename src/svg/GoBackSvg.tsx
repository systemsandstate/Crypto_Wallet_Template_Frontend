import * as React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
    goBackColor?: string;
};

const GoBackSvg: React.FC<Props> = ({ goBackColor = "#1B1D4D" }) => (
    <Svg width={8} height={14} fill="none">
        <Path
            d="M7 13 1 7l6-6"
            stroke={goBackColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default GoBackSvg;
