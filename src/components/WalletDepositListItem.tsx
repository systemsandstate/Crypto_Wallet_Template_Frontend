import { View, Text, TouchableOpacity } from "react-native";
import React, { useMemo } from "react";

import { WalletTransfer } from "../services/api";
import { NETWORK_SHORT } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { formatUsdtAmount, formatNativeAmount } from "../utils/formatAmount";

type Props = {
    item: WalletTransfer;
    onPress: () => void;
    showDate?: boolean;
};

const shortAddress = (address: string) =>
    address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

const WalletDepositListItem: React.FC<Props> = ({ item, onPress, showDate }) => {
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
        const network =
            item.network && NETWORK_SHORT[item.network as keyof typeof NETWORK_SHORT]
                ? NETWORK_SHORT[item.network as keyof typeof NETWORK_SHORT]
                : item.network;
        const parts: string[] = [];

        if (isSend) {
            parts.push(t.payment.sentOnChain);
            if (item.toAddress) parts.push(`${t.transaction.to} ${shortAddress(item.toAddress)}`);
        } else {
            parts.push(t.payment.depositReceived);
            if (item.fromAddress) parts.push(`${t.transaction.from} ${shortAddress(item.fromAddress)}`);
        }

        if (network) parts.push(network);
        if (item.txHash) parts.push(`${item.txHash.slice(0, 10)}…`);
        if (showDate) {
            parts.push(
                new Date(item.timestamp).toLocaleString(dateLocale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                })
            );
        }

        return parts.join(" · ");
    }, [dateLocale, isSend, item, showDate, t]);

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
            <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                <Text style={{ ...FONTS.H6, color: colors.mainDark }}>{title}</Text>
                <Text style={{ fontSize: 12, color: colors.bodyTextColor }} numberOfLines={2}>
                    {subtitle}
                </Text>
            </View>
            <Text style={{ ...FONTS.H6, color: isSend ? colors.mainDark : colors.green, flexShrink: 0 }}>
                {isSend ? "−" : "+"}
                {amountLabel} {item.currency}
            </Text>
        </TouchableOpacity>
    );
};

export default WalletDepositListItem;
