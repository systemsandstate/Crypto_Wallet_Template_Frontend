import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

export type WeeklyBarDay = {
    label: string;
    received: number;
    sent: number;
    isToday?: boolean;
};

type Props = {
    days: WeeklyBarDay[];
    receivedColor: string;
    sentColor: string;
    trackColor: string;
    labelColor: string;
    mutedColor?: string;
    receivedLabel: string;
    sentLabel: string;
    emptyLabel: string;
    formatValue: (value: number) => string;
};

const BAR_WIDTH = 10;
const GRID_LINES = 4;
const BAR_AREA_HEIGHT = 96;
const VALUE_LABEL_HEIGHT = 14;
const DAY_LABEL_HEIGHT = 16;
const CHART_PADDING_V = 10;

const WeeklyBarChart: React.FC<Props> = ({
    days,
    receivedColor,
    sentColor,
    trackColor,
    labelColor,
    mutedColor,
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
    const gridColor = mutedColor ?? trackColor;

    const barHeight = (value: number) => {
        if (value <= 0) return 0;
        return Math.max(6, (value / maxValue) * BAR_AREA_HEIGHT);
    };

    const emptyHeight =
        CHART_PADDING_V * 2 + VALUE_LABEL_HEIGHT + BAR_AREA_HEIGHT + DAY_LABEL_HEIGHT + 8;

    return (
        <View>
            <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: receivedColor }]} />
                    <Text style={[styles.legendText, { color: labelColor }]}>{receivedLabel}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: sentColor }]} />
                    <Text style={[styles.legendText, { color: labelColor }]}>{sentLabel}</Text>
                </View>
            </View>

            {!hasData ? (
                <View style={[styles.emptyWrap, { height: emptyHeight, borderColor: trackColor }]}>
                    <Text style={{ color: labelColor, fontSize: 13 }}>{emptyLabel}</Text>
                </View>
            ) : (
                <View style={[styles.chartShell, { borderColor: trackColor }]}>
                    <View
                        style={[
                            styles.plotArea,
                            {
                                paddingTop: CHART_PADDING_V,
                                paddingBottom: CHART_PADDING_V,
                            },
                        ]}
                    >
                        {Array.from({ length: GRID_LINES }, (_, index) => (
                            <View
                                key={`grid-${index}`}
                                style={[
                                    styles.gridLine,
                                    {
                                        bottom:
                                            CHART_PADDING_V +
                                            DAY_LABEL_HEIGHT +
                                            (BAR_AREA_HEIGHT / (GRID_LINES - 1)) * index,
                                        backgroundColor: gridColor,
                                        opacity: index === 0 ? 0.9 : 0.35,
                                    },
                                ]}
                            />
                        ))}

                        <View style={styles.barsRow}>
                            {days.map((day) => {
                                const receivedHeight = barHeight(day.received);
                                const sentHeight = barHeight(day.sent);
                                const dayTotal = day.received + day.sent;

                                return (
                                    <View key={day.label} style={styles.dayColumn}>
                                        <View style={styles.valueLabelSlot}>
                                            {dayTotal > 0 ? (
                                                <Text
                                                    style={[styles.barTopLabel, { color: labelColor }]}
                                                    numberOfLines={1}
                                                    adjustsFontSizeToFit
                                                    minimumFontScale={0.8}
                                                >
                                                    {formatValue(dayTotal)}
                                                </Text>
                                            ) : null}
                                        </View>

                                        <View style={[styles.barPair, { height: BAR_AREA_HEIGHT }]}>
                                            <View style={styles.barSlot}>
                                                <View
                                                    style={[
                                                        styles.barTrack,
                                                        {
                                                            height: BAR_AREA_HEIGHT,
                                                            backgroundColor: trackColor,
                                                        },
                                                    ]}
                                                />
                                                {receivedHeight > 0 ? (
                                                    <View
                                                        style={[
                                                            styles.bar,
                                                            {
                                                                height: receivedHeight,
                                                                width: BAR_WIDTH,
                                                                backgroundColor: receivedColor,
                                                            },
                                                        ]}
                                                    />
                                                ) : null}
                                            </View>
                                            <View style={styles.barSlot}>
                                                <View
                                                    style={[
                                                        styles.barTrack,
                                                        {
                                                            height: BAR_AREA_HEIGHT,
                                                            backgroundColor: trackColor,
                                                        },
                                                    ]}
                                                />
                                                {sentHeight > 0 ? (
                                                    <View
                                                        style={[
                                                            styles.bar,
                                                            {
                                                                height: sentHeight,
                                                                width: BAR_WIDTH,
                                                                backgroundColor: sentColor,
                                                            },
                                                        ]}
                                                    />
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.dayLabelsRow}>
                            {days.map((day) => (
                                <View key={`${day.label}-axis`} style={styles.dayLabelSlot}>
                                    <Text
                                        style={[
                                            styles.dayLabel,
                                            {
                                                color: day.isToday ? receivedColor : labelColor,
                                                fontWeight: day.isToday ? "700" : "500",
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {day.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    legendRow: {
        flexDirection: "row",
        gap: 14,
        marginBottom: 12,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendSwatch: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 12,
        fontWeight: "500",
    },
    chartShell: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
    },
    plotArea: {
        position: "relative",
        paddingHorizontal: 8,
    },
    gridLine: {
        position: "absolute",
        left: 8,
        right: 8,
        height: StyleSheet.hairlineWidth,
    },
    barsRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 4,
    },
    dayColumn: {
        flex: 1,
        alignItems: "center",
        minWidth: 0,
    },
    valueLabelSlot: {
        height: VALUE_LABEL_HEIGHT,
        alignItems: "center",
        justifyContent: "flex-end",
        marginBottom: 4,
        width: "100%",
    },
    barTopLabel: {
        fontSize: 9,
        fontWeight: "600",
        textAlign: "center",
    },
    barPair: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 4,
        width: "100%",
    },
    barSlot: {
        width: BAR_WIDTH,
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
    },
    barTrack: {
        position: "absolute",
        bottom: 0,
        width: BAR_WIDTH,
        borderRadius: 999,
        opacity: 0.35,
    },
    bar: {
        borderTopLeftRadius: 999,
        borderTopRightRadius: 999,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
    },
    dayLabelsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 4,
        marginTop: 8,
        minHeight: DAY_LABEL_HEIGHT,
    },
    dayLabelSlot: {
        flex: 1,
        alignItems: "center",
        minWidth: 0,
    },
    dayLabel: {
        fontSize: 10,
        lineHeight: 14,
        textTransform: "capitalize",
        textAlign: "center",
    },
    emptyWrap: {
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
});

export default WeeklyBarChart;
