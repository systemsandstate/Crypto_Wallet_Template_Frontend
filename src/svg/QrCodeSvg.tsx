import * as React from "react";
import Svg, { Path, Rect } from "react-native-svg";

type Props = {
    color?: string;
    size?: number;
};

const QrCodeSvg: React.FC<Props> = ({ color = "#fff", size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
        <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
        <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
        <Path d="M14 14h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Zm0-4h2v2h-2v-2Z" fill={color} />
    </Svg>
);

export default QrCodeSvg;
