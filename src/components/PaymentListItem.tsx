import { View, Text, TouchableOpacity } from "react-native";
import React, { useMemo } from "react";

import { PaymentRequest } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";
import { formatUsdtAmount } from "../utils/formatAmount";
import { formatMessage } from "../i18n";

type Props = {
    item: PaymentRequest;
    onPress: () => void;
    showDate?: boolean;
};

const PaymentListItem: React.FC<Props> = ({ item, onPress, showDate }) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();

    const payerName = item.reference?.trim() || t.transaction.counterpartyUnknown;
    const title = `${t.payment.walletReceive} · ${item.currency}`;
    const amountLabel = `$${formatUsdtAmount(item.amount, dateLocale)}`;
    const isPaid = item.status === "PAID";

    const subtitle = useMemo(() => {
        const parts: string[] = [
            formatMessage(t.transaction.receivedFrom, { name: payerName }),
        ];

        if (item.network) {
            parts.push(t.payment.usdtPayment);
        }

        if (showDate) {
            parts.push(
                new Date(item.paidAt || item.createdAt).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                })
            );
        }

        return parts.join(" · ");
    }, [dateLocale, item.createdAt, item.network, item.paidAt, payerName, showDate, t]);

    return (
        <View
            style={{
                backgroundColor: colors.white,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                padding: DENSITY.listRowPaddingH,
                marginBottom: 6,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <TouchableOpacity
                style={{ flex: 1, minWidth: 0, paddingRight: 10 }}
                onPress={onPress}
                activeOpacity={0.75}
                accessibilityRole="button"
            >
                <Text style={{ ...FONTS.H6, color: colors.mainDark }}>{title}</Text>
                <Text style={{ fontSize: 11, color: colors.bodyTextColor }} numberOfLines={2}>
                    {subtitle}
                </Text>
            </TouchableOpacity>
            <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                <Text style={{ ...FONTS.H6, color: isPaid ? colors.green : colors.mainDark }}>
                    +{amountLabel} {item.currency}
                </Text>
            </View>
        </View>
    );
};

export default PaymentListItem;
