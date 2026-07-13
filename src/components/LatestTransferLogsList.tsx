import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import { formatUsdtAmount } from "../utils/formatAmount";
import type { LatestTransferLog } from "../hooks/useLatestTransferLogs";

type Props = {
    title: string;
    hint?: string;
    logs: LatestTransferLog[];
    onSelect: (log: LatestTransferLog) => void;
};

const LatestTransferLogsList: React.FC<Props> = ({ title, hint, logs, onSelect }) => {
    const { colors, FONTS } = useTheme();
    const { dateLocale } = useTranslation();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    marginTop: 4,
                },
                title: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginBottom: 4,
                },
                hint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginBottom: 10,
                    lineHeight: 15,
                },
                list: {
                    gap: 8,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                rowMain: {
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 10,
                },
                rowName: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                },
                rowMeta: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginTop: 2,
                },
                rowAmount: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.red,
                    flexShrink: 0,
                },
            }),
        [FONTS, colors]
    );

    if (logs.length === 0) return null;

    return (
        <View style={styles.wrap}>
            <Text style={styles.title}>{title}</Text>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            <View style={styles.list}>
                {(logs ?? []).map((log) => (
                    <TouchableOpacity
                        key={log.id}
                        style={styles.row}
                        activeOpacity={0.75}
                        onPress={() => onSelect(log)}
                        accessibilityRole="button"
                        accessibilityLabel={`${log.label} ${formatUsdtAmount(log.amount, dateLocale)} USDT ${log.network}`}
                    >
                        <View style={styles.rowMain}>
                            <Text style={styles.rowName} numberOfLines={1}>
                                {log.label}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                                {new Date(log.timestamp).toLocaleString(dateLocale, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}{" "}
                                · {log.network}
                            </Text>
                        </View>
                        <Text style={styles.rowAmount}>
                            −${formatUsdtAmount(log.amount, dateLocale)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default LatestTransferLogsList;
