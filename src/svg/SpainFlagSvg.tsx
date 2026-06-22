import * as React from "react";
import Svg, { Rect } from "react-native-svg";

type Props = {
    width?: number;
    height?: number;
};

const SpainFlagSvg: React.FC<Props> = ({ width = 60, height = 40 }) => (
    <Svg width={width} height={height} viewBox="0 0 60 40">
        <Rect width="60" height="40" fill="#AA151B" />
        <Rect y="10" width="60" height="20" fill="#F1BF00" />
    </Svg>
);

export default SpainFlagSvg;
