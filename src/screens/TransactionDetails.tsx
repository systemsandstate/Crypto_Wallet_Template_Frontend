import { Text, ScrollView, View, Image, ActivityIndicator, Alert, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { theme } from "../constants";
import { api, PaymentRequest } from "../services/api";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";

const statusMeta: Record<string, { label: string; color: string }> = {
    PAID: { label: "Success", color: theme.COLORS.green },
    PENDING: { label: "Waiting", color: "#EECC55" },
    EXPIRED: { label: "Expired", color: "#FF8A71" },
    FAILED: { label: "Failed", color: "#FF8A71" },
    CANCELLED: { label: "Cancelled", color: "#868698" },
};

const copyText = async (label: string, value: string) => {
    try {
        if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
            await navigator.clipboard.writeText(value);
        } else {
            Alert.alert(label, value);
            return;
        }
        Alert.alert("Copied", `${label} copied to clipboard`);
    } catch {
        Alert.alert("Copy failed", "Could not copy to clipboard");
    }
};

const TransactionDetails: React.FC = ({ navigation, route }: any) => {
    const paymentId: string | undefined = route.params?.paymentId;
    const initial: PaymentRequest | undefined = route.params?.payment;
    const [payment, setPayment] = useState<PaymentRequest | null>(initial || null);
    const [loading, setLoading] = useState(!initial && !!paymentId);

    useEffect(() => {
        if (!paymentId) return;
        setLoading(true);
        api.getPayment(paymentId)
            .then((res) => setPayment(res.data))
            .catch(() => setPayment(null))
            .finally(() => setLoading(false));
    }, [paymentId]);

    const DetailItem = ({ leftTitle, rightTitle }: { leftTitle: string; rightTitle: string }) => (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 17,
                borderBottomWidth: 1,
                borderBottomColor: "#CED6E1",
            }}
        >
            <Text
                style={{
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 16,
                    lineHeight: 16 * 1.6,
                    color: theme.COLORS.bodyTextColor,
                    flex: 1,
                    marginRight: 12,
                }}
            >
                {leftTitle}
            </Text>
            <Text
                style={{
                    ...theme.FONTS.H6,
                    color: theme.COLORS.mainDark,
                    textAlign: "right",
                    flexShrink: 1,
                }}
            >
                {rightTitle}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
            </SafeAreaView>
        );
    }

    if (!payment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
                <components.Header goBack={true} />
                <Text style={{ textAlign: "center", marginTop: 40, color: theme.COLORS.bodyTextColor }}>
                    Payment not found.
                </Text>
            </SafeAreaView>
        );
    }

    const meta = statusMeta[payment.status] || { label: payment.status, color: theme.COLORS.bodyTextColor };
    const dateStr = payment.paidAt
        ? new Date(payment.paidAt).toLocaleString()
        : new Date(payment.createdAt).toLocaleString();

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <Image
                source={require("../assets/bg/04.png")}
                style={{ width: "100%", height: 400, position: "absolute" }}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header goBack={true} />
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_BAR_HEIGHT + 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={require("../assets/icons/26.png")}
                        style={{ width: 60, height: 60, alignSelf: "center", marginBottom: 30 }}
                    />
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 12,
                            color: theme.COLORS.bodyTextColor,
                            marginBottom: 10,
                        }}
                    >
                        {dateStr}
                    </Text>
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.Mulish_700Bold,
                            fontSize: 28,
                            lineHeight: 28 * 1.1,
                            color: theme.COLORS.mainDark,
                            marginBottom: 10,
                        }}
                    >
                        + {payment.amount} {payment.currency}
                    </Text>
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 16,
                            color: theme.COLORS.bodyTextColor,
                            marginBottom: 9,
                        }}
                    >
                        {payment.reference || "USDT payment"}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingBottom: 30,
                            borderBottomWidth: 1,
                            borderBottomColor: "#CED6E1",
                        }}
                    >
                        <Image
                            source={require("../assets/other-icons/05.png")}
                            style={{ width: 16, height: 16, marginRight: 6 }}
                        />
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_600SemiBold,
                                fontSize: 14,
                                lineHeight: 14 * 1.3,
                                color: meta.color,
                            }}
                        >
                            {meta.label}
                        </Text>
                    </View>
                    <View style={{ paddingHorizontal: 20, marginBottom: theme.SIZES.height * 0.1 }}>
                        <DetailItem leftTitle="Payment ID" rightTitle={payment.id.slice(0, 8) + "…"} />
                        <DetailItem leftTitle="Network" rightTitle={payment.network} />
                        <DetailItem leftTitle="Amount" rightTitle={`${payment.amount} ${payment.currency}`} />
                        {payment.paidAmount && (
                            <DetailItem leftTitle="Paid amount" rightTitle={`${payment.paidAmount} ${payment.currency}`} />
                        )}
                        {payment.txHash && (
                            <DetailItem leftTitle="Tx hash" rightTitle={payment.txHash.slice(0, 12) + "…"} />
                        )}
                        {payment.failureReason && (
                            <DetailItem leftTitle="Note" rightTitle={payment.failureReason} />
                        )}
                        {payment.expiresAt && payment.status === "PENDING" && (
                            <DetailItem
                                leftTitle="Expires"
                                rightTitle={new Date(payment.expiresAt).toLocaleString()}
                            />
                        )}
                    </View>
                    {payment.status === "PENDING" && (
                        <components.Button
                            title="View QR & status"
                            onPress={() => navigation.navigate("InvoiceSent", { payment })}
                            containerStyle={{ paddingHorizontal: 20, marginBottom: 12 }}
                        />
                    )}
                    <components.Button
                        title="Copy payment ID"
                        onPress={() => copyText("Payment ID", payment.id)}
                        containerStyle={{ paddingHorizontal: 20, marginBottom: 12 }}
                    />
                    {payment.txHash && (
                        <components.Button
                            title="Copy transaction hash"
                            onPress={() => copyText("Transaction hash", payment.txHash!)}
                            containerStyle={{ paddingHorizontal: 20, marginBottom: 12 }}
                        />
                    )}
                    <components.Button
                        title="Back"
                        onPress={() => navigation.goBack()}
                        containerStyle={{ paddingHorizontal: 20, marginBottom: 20 }}
                    />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default TransactionDetails;
