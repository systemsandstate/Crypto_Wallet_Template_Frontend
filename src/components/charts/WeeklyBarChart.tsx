import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

export type WeeklyBarDay = {
    label: string;
    received: number;
    sent: number;
};

type Props = {
    days: WeeklyBarDay[];
    receivedColor: string;
    sentColor: string;
    trackColor: string;
    labelColor: string;
    receivedLabel: string;
    sentLabel: string;
    emptyLabel: string;
    formatValue: (value: number) => string;
};

const CHART_HEIGHT = 148;
const BAR_WIDTH = 12;

const WeeklyBarChart: React.FC<Props> = ({
    days,
    receivedColor,
    sentColor,
    trackColor,
    labelColor,
    receivedLabel,
    sentLabel,
    emptyLabel,
    formatValue,
}) => {
    const maxValue = useMemo(() => {
        const peak = days.reduce(
            (current, day) => Math.max(current, day.received, day.sent),
            0
        );
        return peak > 0 ? peak : 1;
    }, [days]);

    const hasData = days.some((day) => day.received > 0 || day.sent > 0);

    return (
        <View>
            <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: receivedColor }]} />
                    <Text style={[styles.legendText, { color: labelColor }]}>{receivedLabel}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: sentColor }]} />
                    <Text style={[styles.legendText, { color: labelColor }]}>{sentLabel}</Text>
                </View>
            </View>

            {!hasData ? (
                <View style={[styles.emptyWrap, { height: CHART_HEIGHT, borderColor: trackColor }]}>
                    <Text style={{ color: labelColor, fontSize: 13 }}>{emptyLabel}</Text>
                </View>
            ) : (
                <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
                    {days.map((day) => {
                        const receivedHeight = Math.max(4, (day.received / maxValue) * (CHART_HEIGHT - 24));
                        const sentHeight = Math.max(4, (day.sent / maxValue) * (CHART_HEIGHT - 24));
                        return (
                            <View key={day.label} style={[styles.dayColumn, { width: BAR_WIDTH * 2 + 6 }]}>
                                <View style={styles.barPair}>
                                    <View style={styles.barSlot}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: receivedHeight,
                                                    width: BAR_WIDTH,
                                                    backgroundColor: receivedColor,
                                                    opacity: day.received > 0 ? 1 : 0.25,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.barSlot}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: sentHeight,
                                                    width: BAR_WIDTH,
                                                    backgroundColor: sentColor,
                                                    opacity: day.sent > 0 ? 1 : 0.25,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.dayLabel, { color: labelColor }]} numberOfLines={1}>
                                    {day.label}
                                </Text>
                                {day.received + day.sent > 0 ? (
                                    <Text style={[styles.dayValue, { color: labelColor }]} numberOfLines={1}>
                                        {formatValue(day.received + day.sent)}
                                    </Text>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    legendRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 14,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
    },
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 4,
    },
    dayColumn: {
        alignItems: "center",
        gap: 6,
    },
    barPair: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 6,
        height: CHART_HEIGHT - 36,
    },
    barSlot: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
    },
    bar: {
        borderRadius: 6,
    },
    dayLabel: {
        fontSize: 11,
        textTransform: "capitalize",
    },
    dayValue: {
        fontSize: 10,
    },
    emptyWrap: {
        borderWidth: 1,
        borderRadius: 14,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
});

export default WeeklyBarChart;
