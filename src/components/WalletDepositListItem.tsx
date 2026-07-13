import { View, Text, TouchableOpacity } from "react-native";
import React, { useMemo } from "react";

import { WalletTransfer } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";
import { formatUsdtAmount, formatNativeAmount } from "../utils/formatAmount";
import { formatMessage } from "../i18n";
import type { CounterpartyLabel } from "../utils/resolveCounterpartyLabel";

type Props = {
    item: WalletTransfer;
    onPress: () => void;
    showDate?: boolean;
    counterparty?: CounterpartyLabel | null;
};

const WalletDepositListItem: React.FC<Props> = ({
    item,
    onPress,
    showDate,
    counterparty,
}) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();

    const isSend = item.type === "SEND";
    const isUsdt = item.currency === "USDT";

    const amountLabel = isUsdt
        ? `$${formatUsdtAmount(item.amount, dateLocale)}`
        : formatNativeAmount(item.amount, dateLocale);

    const title = isSend
        ? `${t.payment.walletSend} · ${item.currency}`
        : `${t.payment.walletReceive} · ${item.currency}`;

    const subtitle = useMemo(() => {
        const parts: string[] = [];

        if (counterparty?.name) {
            parts.push(
                isSend
                    ? formatMessage(t.transaction.sentTo, { name: counterparty.name })
                    : formatMessage(t.transaction.receivedFrom, { name: counterparty.name })
            );
        } else {
            parts.push(isSend ? t.payment.sentOnChain : t.payment.depositReceived);
        }

        if (showDate) {
            parts.push(
                new Date(item.timestamp).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                })
            );
        }

        return parts.join(" · ");
    }, [counterparty?.name, dateLocale, isSend, item.timestamp, showDate, t]);

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
                <Text style={{ ...FONTS.H6, color: isSend ? colors.red : colors.green }}>
                    {isSend ? "−" : "+"}
                    {amountLabel} {item.currency}
                </Text>
            </View>
        </View>
    );
};

export default WalletDepositListItem;
