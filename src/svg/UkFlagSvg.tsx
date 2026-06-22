import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";

type Props = {
    width?: number;
    height?: number;
};

/** Simplified Union Jack for locale picker (renders on web without emoji fonts). */
const UkFlagSvg: React.FC<Props> = ({ width = 60, height = 40 }) => (
    <Svg width={width} height={height} viewBox="0 0 60 40">
        <Rect width="60" height="40" fill="#012169" />
        <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="7" />
        <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
        <Path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="11" />
        <Path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6" />
    </Svg>
);

export default UkFlagSvg;
