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
    segmentGap?: number;
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
    segmentGap = 4,
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
    const activeSegments = segments.filter((segment) => segment.value > 0);

    const arcs = useMemo(() => {
        if (total <= 0 || activeSegments.length === 0) return [];

        const gapTotal = segmentGap * activeSegments.length;
        const drawable = Math.max(circumference - gapTotal, 1);
        let offset = segmentGap / 2;

        return activeSegments.map((segment) => {
            const ratio = segment.value / total;
            const length = Math.max(ratio * drawable, strokeWidth);
            const arc = {
                color: segment.color,
                length,
                offset,
                label: segment.label,
                value: segment.value,
            };
            offset += length + segmentGap;
            return arc;
        });
    }, [activeSegments, circumference, segmentGap, segments, strokeWidth, total]);

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
                    opacity={0.55}
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
                              strokeLinecap="round"
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
        paddingHorizontal: 24,
    },
    centerValue: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        letterSpacing: -0.3,
    },
    centerLabel: {
        marginTop: 4,
        fontSize: 11,
        textAlign: "center",
        letterSpacing: 0.2,
        textTransform: "uppercase",
    },
});

export default DonutChart;
