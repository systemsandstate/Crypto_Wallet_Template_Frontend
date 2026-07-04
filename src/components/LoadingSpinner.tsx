import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
    size?: number;
    shellColor?: string;
    arcColor?: string;
    style?: ViewStyle;
};

/** White circular shell + short navy arc (shared loading indicator). */
const LoadingSpinner: React.FC<Props> = ({
    size = 48,
    shellColor = "#FFFFFF",
    arcColor = "#1B1D4D",
    style,
}) => {
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [spin]);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const iconSize = Math.round(size * 0.52);
    const stroke = Math.max(2.2, size * 0.055);
    // ~100° arc on r=9 (circumference ≈ 56.5)
    const arcLen = 16;
    const gapLen = 40;

    return (
        <View
            style={[
                styles.shell,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: shellColor,
                },
                Platform.OS === "web"
                    ? ({ boxShadow: "0 2px 10px rgba(27, 29, 77, 0.16)" } as object)
                    : {
                          shadowColor: "#1B1D4D",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.14,
                          shadowRadius: 8,
                          elevation: 4,
                      },
                style,
            ]}
        >
            <Animated.View style={{ transform: [{ rotate }] }}>
                <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
                    <Circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke={arcColor}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${arcLen} ${gapLen}`}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    shell: {
        alignItems: "center",
        justifyContent: "center",
    },
});

export default LoadingSpinner;
