import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type DonutSegment = {
    value: number;
    color: string;
    label: string;
};

type Props = {
    segments: DonutSegment[];
    size?: number;
    strokeWidth?: number;
    centerLabel?: string;
    centerValue?: string;
    emptyLabel?: string;
    trackColor?: string;
    labelColor?: string;
    valueColor?: string;
};

const DonutChart: React.FC<Props> = ({
    segments,
    size = 220,
    strokeWidth = 24,
    centerLabel,
    centerValue,
    emptyLabel,
    trackColor = "#2A2A36",
    labelColor = "#9DA3B8",
    valueColor = "#F2F3F7",
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    const arcs = useMemo(() => {
        if (total <= 0) return [];
        let offset = 0;
        return segments.map((segment) => {
            const ratio = segment.value / total;
            const length = circumference * ratio;
            const arc = {
                color: segment.color,
                length,
                offset,
                label: segment.label,
                value: segment.value,
            };
            offset += length;
            return arc;
        });
    }, [circumference, segments, total]);

    return (
        <View style={[styles.wrap, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {total > 0
                    ? arcs.map((arc, index) => (
                          <Circle
                              key={`${arc.label}-${index}`}
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke={arc.color}
                              strokeWidth={strokeWidth}
                              fill="none"
                              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                              strokeDashoffset={-arc.offset}
                              strokeLinecap="butt"
                              rotation={-90}
                              origin={`${size / 2}, ${size / 2}`}
                          />
                      ))
                    : null}
            </Svg>
            <View style={styles.center} pointerEvents="none">
                {centerValue ? (
                    <Text style={[styles.centerValue, { color: valueColor }]} numberOfLines={1}>
                        {centerValue}
                    </Text>
                ) : null}
                {centerLabel ? (
                    <Text style={[styles.centerLabel, { color: labelColor }]} numberOfLines={2}>
                        {total > 0 ? centerLabel : emptyLabel || centerLabel}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
    },
    center: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
    },
    centerValue: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    centerLabel: {
        marginTop: 4,
        fontSize: 12,
        textAlign: "center",
    },
});

export default DonutChart;
