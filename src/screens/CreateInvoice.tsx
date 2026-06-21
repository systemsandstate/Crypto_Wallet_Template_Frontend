import { Text, View, ActivityIndicator, Alert, Image } from "react-native";
import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { components } from "../components";
import { svg } from "../svg";
import { theme } from "../constants";
import { api, PaymentRequest } from "../services/api";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UsdtNetwork, formatUsdtNetwork } from "../constants/usdtNetworks";

const CreateInvoice: React.FC = () => {
    const navigation: any = useNavigation();
    const [amount, setAmount] = useState("");
    const [reference, setReference] = useState("");
    const [network, setNetwork] = useState<UsdtNetwork>("TRC20");
    const [loading, setLoading] = useState(false);
    const [recentPayments, setRecentPayments] = useState<PaymentRequest[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    const loadRecentPayments = useCallback(() => {
        setLoadingRecent(true);
        api.listPayments({ limit: 5 })
            .then((res) => setRecentPayments(res.data.items))
            .catch(() => setRecentPayments([]))
            .finally(() => setLoadingRecent(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRecentPayments();
        }, [loadRecentPayments])
    );

    const handleCreate = async () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) {
            Alert.alert("Error", "Enter a valid amount");
            return;
        }
        setLoading(true);
        try {
            const res = await api.createPayment({
                amount: num,
                reference: reference.trim() || undefined,
                network,
            });
            navigation.navigate("InvoiceSent", { payment: res.data });
        } catch (err: any) {
            Alert.alert("Payment failed", err.message || "Could not create payment request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <Image
                source={require("../assets/bg-01.png")}
                style={{
                    height: 350,
                    width: theme.SIZES.width,
                    position: "absolute",
                    zIndex: -1,
                }}
            />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header
                    title="Create payment"
                    goBack={true}
                    goBackColor={theme.COLORS.white}
                    titleStyle={{ color: theme.COLORS.white }}
                />
                <KeyboardAwareScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: TAB_BAR_HEIGHT + 16,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.H2,
                            color: theme.COLORS.mainDark,
                            marginTop: 20,
                            marginBottom: 8,
                        }}
                    >
                        New payment
                    </Text>
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 14,
                            color: theme.COLORS.bodyTextColor,
                            marginBottom: 24,
                            textAlign: "center",
                            lineHeight: 14 * 1.6,
                        }}
                    >
                        Create a USDT payment request on your chosen network and show the QR code to your customer.
                    </Text>
                    <components.NetworkSelector value={network} onChange={setNetwork} />
                    <components.InputField
                        placeholder="Amount (USDT)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        containerStyle={{ marginBottom: 14 }}
                    />
                    <components.InputField
                        placeholder="Reference (optional) e.g. ORDER-1042"
                        value={reference}
                        onChangeText={setReference}
                        containerStyle={{ marginBottom: 14 }}
                    />
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 12,
                            color: theme.COLORS.bodyTextColor,
                            marginBottom: 24,
                        }}
                    >
                        {formatUsdtNetwork(network)}
                    </Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
                    ) : (
                        <components.Button
                            title="Generate QR"
                            onPress={handleCreate}
                            containerStyle={{ marginBottom: 28 }}
                            leading={<svg.QrCodeSvg size={20} color={theme.COLORS.white} />}
                        />
                    )}

                    <View
                        style={{
                            borderTopWidth: 1,
                            borderTopColor: "#E8ECF0",
                            paddingTop: 20,
                        }}
                    >
                        <Text style={{ ...theme.FONTS.H4, color: theme.COLORS.mainDark, marginBottom: 12 }}>
                            Recent payments
                        </Text>
                        {loadingRecent ? (
                            <ActivityIndicator color={theme.COLORS.mainDark} style={{ marginVertical: 16 }} />
                        ) : recentPayments.length === 0 ? (
                            <Text
                                style={{
                                    color: theme.COLORS.bodyTextColor,
                                    textAlign: "center",
                                    paddingVertical: 16,
                                    fontSize: 14,
                                }}
                            >
                                No payments yet. Your last 5 will appear here.
                            </Text>
                        ) : (
                            recentPayments.map((item) => (
                                <components.PaymentListItem
                                    key={item.id}
                                    item={item}
                                    showDate
                                    onPress={() =>
                                        navigation.navigate("TransactionDetails", {
                                            payment: item,
                                            paymentId: item.id,
                                        })
                                    }
                                />
                            ))
                        )}
                    </View>
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </View>
    );
};

export default CreateInvoice;
