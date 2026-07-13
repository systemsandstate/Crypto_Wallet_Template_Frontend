import * as React from "react";
import Svg, { Rect } from "react-native-svg";

import { MENU_ICON_SIZE, MENU_ICON_STROKE } from "../constants/menuIcon";

type Props = {
    color?: string;
    size?: number;
};

const finder = (x: number, y: number, color: string) => (
    <>
        <Rect
            x={x}
            y={y}
            width={7}
            height={7}
            rx={1}
            stroke={color}
            strokeWidth={MENU_ICON_STROKE}
            fill="none"
        />
        <Rect x={x + 2} y={y + 2} width={3} height={3} fill={color} />
    </>
);

/** QR code — filled modules render sharply at small sizes. */
const QrCodeSvg: React.FC<Props> = ({ color = "#2563EB", size = MENU_ICON_SIZE }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {finder(3, 3, color)}
        {finder(14, 3, color)}
        {finder(3, 14, color)}
        <Rect x={14} y={14} width={3} height={3} fill={color} />
        <Rect x={18} y={14} width={3} height={3} fill={color} />
        <Rect x={14} y={18} width={3} height={3} fill={color} />
        <Rect x={18} y={18} width={3} height={3} fill={color} />
    </Svg>
);

export default QrCodeSvg;
