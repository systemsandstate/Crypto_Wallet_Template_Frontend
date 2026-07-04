import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

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

const WalletDepositListItem: React.FC<Props> = ({ item, onPress, showDate }) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();

    const amountLabel =
        item.currency === "USDT"
            ? formatUsdtAmount(item.amount, dateLocale)
            : formatNativeAmount(item.amount, dateLocale);

    const isSend = item.type === "SEND";

    const title = isSend
        ? item.currency === "USDT"
            ? t.payment.walletSend
            : `${item.currency} ${t.payment.walletSend}`
        : item.currency === "USDT"
          ? t.payment.walletDeposit
          : `${item.currency} ${t.payment.walletDeposit}`;

    const subtitle = isSend
        ? `${t.payment.sentOnChain}${item.toAddress ? ` · To ${item.toAddress.slice(0, 6)}...${item.toAddress.slice(-4)}` : ""}`
        : t.payment.depositReceived;

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
                <Text style={{ ...FONTS.H6, color: colors.mainDark }}>{title}</Text>
                <Text style={{ fontSize: 12, color: colors.bodyTextColor }}>
                    {subtitle}
                    {item.network ? ` · ${NETWORK_SHORT[item.network as keyof typeof NETWORK_SHORT] || item.network}` : ""}
                    {showDate ? ` · ${new Date(item.timestamp).toLocaleDateString(dateLocale)}` : ""}
                </Text>
            </View>
            <Text style={{ ...FONTS.H6, color: isSend ? colors.mainDark : colors.green }}>
                {isSend ? "−" : "+"}
                {amountLabel} {item.currency}
            </Text>
        </TouchableOpacity>
    );
};

export default WalletDepositListItem;
