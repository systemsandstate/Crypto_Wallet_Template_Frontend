import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

import { PaymentRequest } from "../services/api";
import { NETWORK_SHORT } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { formatUsdtAmount } from "../utils/formatAmount";

type Props = {
    item: PaymentRequest;
    onPress: () => void;
    showDate?: boolean;
};

const PaymentListItem: React.FC<Props> = ({ item, onPress, showDate }) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();

    const statusLabel: Record<string, string> = {
        PENDING: t.payment.statusWaiting,
        PAID: t.payment.statusPaid,
        EXPIRED: t.payment.statusExpired,
        FAILED: t.payment.statusFailed,
        CANCELLED: t.payment.statusCancelled,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: colors.white,
                borderRadius: 10,
                padding: 14,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <View style={{ flex: 1 }}>
                <Text style={{ ...FONTS.H6, color: colors.mainDark }}>
                    {item.reference || t.payment.usdtPayment}
                </Text>
                <Text style={{ fontSize: 12, color: colors.bodyTextColor }}>
                    {statusLabel[item.status] || item.status}
                    {item.network ? ` · ${NETWORK_SHORT[item.network as keyof typeof NETWORK_SHORT] || item.network}` : ""}
                    {showDate ? ` · ${new Date(item.createdAt).toLocaleDateString(dateLocale)}` : ""}
                </Text>
            </View>
            <Text
                style={{
                    ...FONTS.H6,
                    color: item.status === "PAID" ? colors.green : colors.mainDark,
                }}
            >
                {formatUsdtAmount(item.amount, dateLocale)} {item.currency}
            </Text>
        </TouchableOpacity>
    );
};

export default PaymentListItem;
