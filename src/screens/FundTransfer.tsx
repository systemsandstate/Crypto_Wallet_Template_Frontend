import {
    Text,
    ScrollView,
    View,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    TextInput,
} from "react-native";
import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { components } from "../components";
import { theme } from "../constants";
import { svg } from "../svg";
import { api, PaymentRequest } from "../services/api";
import { RootState } from "../store/store";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTranslation } from "../hooks/useTranslation";
import { formatMessage } from "../i18n";
import { getLocalizedNetworkLabel } from "../i18n/network";
import {
    USDT_NETWORKS,
    UsdtNetwork,
    formatUsdtNetwork,
} from "../constants/usdtNetworks";

const userAvatars = [
    require("../assets/users/02.png"),
    require("../assets/users/03.png"),
    require("../assets/users/04.png"),
    require("../assets/users/05.png"),
    require("../assets/users/06.png"),
];

const formatAmount = (value: number) =>
    Number.isFinite(value) ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

const FundTransfer: React.FC = () => {
    const { t } = useTranslation();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const { width, horizontalPadding } = useResponsiveLayout();
    const walletCardWidth = Math.min(300, width - horizontalPadding * 2);
    const [network, setNetwork] = useState<UsdtNetwork>("TRC20");
    const [selectedWallet, setSelectedWallet] = useState<UsdtNetwork>("TRC20");
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [comment, setComment] = useState("");
    const [balance, setBalance] = useState(0);
    const [recentTransfers, setRecentTransfers] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(() => {
        setLoading(true);
        api.listPayments({ limit: 20 })
            .then((res) => {
                const items = res.data.items;
                const paid = items.filter((p) => p.status === "PAID");
                setBalance(paid.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0));
                setRecentTransfers(paid.slice(0, 5));
            })
            .catch(() => {
                setBalance(0);
                setRecentTransfers([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleSend = () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) {
            Alert.alert(t.common.error, t.payment.invalidAmount);
            return;
        }
        if (!address.trim()) {
            Alert.alert(t.common.error, t.withdraw.enterWalletAddress);
            return;
        }
        const note = comment.trim() ? `\n${t.transfer.notePrefix} ${comment.trim()}` : "";
        Alert.alert(
            t.transfer.transferRequest,
            formatMessage(t.transfer.transferMessage, {
                amount: String(num),
                network,
                address: address.trim(),
                note,
            })
        );
    };

    const renderLatestFundTransfers = () => (
        <View
            style={{
                borderBottomWidth: 1,
                paddingBottom: 17,
                borderBottomColor: "#CED6E1",
                marginBottom: 14,
            }}
        >
            <View style={{ marginBottom: 14, marginLeft: 20, marginTop: 14 }}>
                <Text style={{ ...theme.FONTS.H5, color: theme.COLORS.mainDark }}>{t.transfer.latestTransfers}</Text>
            </View>
            {loading ? (
                <ActivityIndicator color={theme.COLORS.mainDark} style={{ marginBottom: 16 }} />
            ) : recentTransfers.length === 0 ? (
                <Text
                    style={{
                        marginLeft: 20,
                        marginBottom: 12,
                        color: theme.COLORS.bodyTextColor,
                        fontSize: 13,
                    }}
                >
                    {t.transfer.noTransfers}
                </Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                    {recentTransfers.map((item, index) => (
                        <TouchableOpacity key={item.id} style={{ width: 72, marginRight: 16 }}>
                            <Image
                                source={userAvatars[index % userAvatars.length]}
                                style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 4 }}
                            />
                            <Text
                                numberOfLines={2}
                                style={{
                                    textAlign: "center",
                                    ...theme.FONTS.Mulish_400Regular,
                                    fontSize: 11,
                                    lineHeight: 13,
                                    color: theme.COLORS.bodyTextColor,
                                }}
                            >
                                {item.reference || `${formatAmount(parseFloat(item.amount))} USDT`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderUseWallet = () => (
        <View style={{ marginBottom: 14 }}>
            <components.SmallHeader title={t.transfer.useWallet} containerStyle={{ marginBottom: 6, marginLeft: 20 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
                {USDT_NETWORKS.map((item) => {
                    const selected = selectedWallet === item;
                    return (
                        <TouchableOpacity
                            key={item}
                            onPress={() => {
                                setSelectedWallet(item);
                                setNetwork(item);
                            }}
                            style={{
                                padding: 14,
                                width: walletCardWidth,
                                backgroundColor: theme.COLORS.white,
                                borderRadius: 10,
                                marginRight: 14,
                                borderWidth: 1,
                                borderColor: selected ? theme.COLORS.mainDark : "#E8ECF0",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                <components.NetworkLogo network={item} size={36} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={{ ...theme.FONTS.Mulish_600SemiBold, color: theme.COLORS.mainDark }}>
                                        USDT · {item}
                                    </Text>
                                    <Text style={{ ...theme.FONTS.Mulish_400Regular, fontSize: 12, color: theme.COLORS.bodyTextColor }}>
                                        {getLocalizedNetworkLabel(item, t)}
                                    </Text>
                                </View>
                                <svg.UsdtMarkSvg size={22} />
                            </View>
                            <Text style={{ ...theme.FONTS.Mulish_400Regular, fontSize: 12, color: theme.COLORS.bodyTextColor }}>
                                {merchant?.businessName || t.balance.merchantWallet}
                            </Text>
                            <Text style={{ ...theme.FONTS.H6, color: theme.COLORS.mainDark, marginTop: 4 }}>
                                {formatAmount(balance)} USDT
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderSendMoney = () => (
        <View>
            <components.SmallHeader title={t.transfer.sendMoneyTo} containerStyle={{ marginBottom: 6, marginLeft: 20 }} />
            <View style={{ paddingHorizontal: 20 }}>
                <components.NetworkSelector value={network} onChange={setNetwork} />
                <View
                    style={{
                        backgroundColor: theme.COLORS.white,
                        width: "100%",
                        borderRadius: 10,
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        marginBottom: 14,
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <components.NetworkLogo network={network} size={18} />
                    <TextInput
                        placeholder={t.transfer.enterWalletAddress}
                        value={address}
                        onChangeText={setAddress}
                        placeholderTextColor="#868698"
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 14,
                            color: theme.COLORS.mainDark,
                            ...theme.FONTS.Mulish_400Regular,
                        }}
                    />
                    <TouchableOpacity style={{ marginLeft: 8 }}>
                        <svg.QrCodeSvg size={18} color={theme.COLORS.mainDark} />
                    </TouchableOpacity>
                </View>
                <components.InputField
                    placeholder={t.payment.amountPlaceholder}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    containerStyle={{ marginBottom: 14 }}
                />
                <View
                    style={{
                        backgroundColor: theme.COLORS.white,
                        width: "100%",
                        borderRadius: 10,
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        marginBottom: 6,
                    }}
                >
                    <TextInput
                        placeholder={t.transfer.comment}
                        value={comment}
                        onChangeText={setComment}
                        placeholderTextColor="#868698"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{
                            height: 100,
                            fontSize: 14,
                            color: theme.COLORS.mainDark,
                            ...theme.FONTS.Mulish_400Regular,
                        }}
                    />
                </View>
                <components.SmallHeader
                    title={`${formatUsdtNetwork(network)} · ${t.transfer.networkFeeVaries}`}
                    containerStyle={{ marginBottom: 18 }}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <components.Header title={t.transfer.title} goBack={true} />
            <components.FormScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {renderLatestFundTransfers()}
                {renderUseWallet()}
                {renderSendMoney()}
                <components.Button
                    title={t.transfer.send}
                    onPress={handleSend}
                    containerStyle={{ paddingHorizontal: 20, marginBottom: 20 }}
                />
            </components.FormScrollView>
        </SafeAreaView>
    );
};

export default FundTransfer;
