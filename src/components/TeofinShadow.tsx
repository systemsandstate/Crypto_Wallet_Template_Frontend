import { View, TouchableOpacity } from "react-native";
import React from "react";
import { Shadow } from "react-native-shadow-2";

import { theme } from "../constants";

type Props = {
    children: React.ReactNode;
    containerStyle?: object;
    shadowStyle?: object;
    onPress?: () => void;
    activeOpacity?: number;
};

const TeofinShadow: React.FC<Props> = ({
    children,
    containerStyle,
    shadowStyle,
    onPress,
    activeOpacity,
}) => {
    return (
        <TouchableOpacity
            style={{ ...containerStyle }}
            onPress={onPress}
            activeOpacity={activeOpacity}
        >
            <Shadow
                style={{
                    width: "100%",
                    borderRadius: 10,
                    backgroundColor: theme.COLORS.white,
                    ...shadowStyle,
                }}
                offset={[0, 0]}
                distance={15}
                startColor={"rgba(6, 38, 100, 0.02)"}
                endColor={"rgba(6, 38, 100, 0.0)"}
            >
                {children}
            </Shadow>
        </TouchableOpacity>
    );
};

export default TeofinShadow;
