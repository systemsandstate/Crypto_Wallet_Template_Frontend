import { View, Text, Image, ActivityIndicator, Alert, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants";
import { components } from "../components";
import { api, PaymentRequest } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";

const InvoiceSent: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const initial: PaymentRequest = route.params?.payment;
    const [payment, setPayment] = useState<PaymentRequest | null>(initial || null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!payment || !["PENDING"].includes(payment.status)) return;

        const interval = setInterval(async () => {
            try {
                const res = await api.getPayment(payment.id);
                setPayment(res.data);
                if (res.data.status !== "PENDING") {
                    clearInterval(interval);
                }
            } catch {
                // ignore poll errors
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [payment?.id, payment?.status]);

    const getStatusTitle = () => {
        if (!payment) return "";
        if (payment.status === "PAID") return t.payment.statusSuccess + "!";
        if (payment.status === "PENDING") return t.transaction.waitingForPayment;
        if (payment.status === "CANCELLED") return t.payment.statusCancelled;
        if (payment.status === "EXPIRED") return t.payment.statusExpired;
        return t.payment.paymentFailed;
    };

    const handleCancel = () => {
        if (!payment) return;
        Alert.alert(t.transaction.cancelPaymentTitle, t.transaction.cancelPaymentConfirm, [
            { text: t.common.no, style: "cancel" },
            {
                text: t.transaction.yesCancel,
                style: "destructive",
                onPress: async () => {
                    setCancelling(true);
                    try {
                        const res = await api.cancelPayment(payment.id);
                        setPayment(res.data);
                    } catch (err: any) {
                        Alert.alert(t.common.error, err.message || t.transaction.couldNotCancel);
                    } finally {
                        setCancelling(false);
                    }
                },
            },
        ]);
    };

    if (!payment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor, justifyContent: "center", alignItems: "center" }}>
                <Text>{t.transaction.noPaymentData}</Text>
            </SafeAreaView>
        );
    }

    const isPaid = payment.status === "PAID";
    const isPending = payment.status === "PENDING";
    const networkLabel = (USDT_NETWORKS as readonly string[]).includes(payment.network)
        ? getLocalizedNetworkLabel(payment.network as UsdtNetwork, t)
        : payment.network;

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <Image source={require("../assets/bg/05.png")} style={styles.background} />
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header goBack={true} />
                <components.ScreenScroll withTabBarInset={false}>
                    <components.MerchantContent style={{ marginTop: 120, alignItems: "center", paddingBottom: 20 }}>
                        <Image
                            source={
                                isPaid
                                    ? require("../assets/other-icons/21.png")
                                    : require("../assets/icons/26.png")
                            }
                            style={{
                                width: isPaid ? 161 : 100,
                                height: isPaid ? 150 : 100,
                                alignSelf: "center",
                                marginBottom: 20,
                                maxWidth: "70%",
                                resizeMode: "contain",
                            }}
                        />
                        <Text
                            style={{
                                textAlign: "center",
                                ...theme.FONTS.H2,
                                color: isPaid ? theme.COLORS.green : theme.COLORS.mainDark,
                                marginBottom: 12,
                            }}
                        >
                            {getStatusTitle()}
                        </Text>
                        <Text
                            style={{
                                textAlign: "center",
                                ...theme.FONTS.Mulish_700Bold,
                                fontSize: 22,
                                color: theme.COLORS.mainDark,
                                marginBottom: 8,
                            }}
                        >
                            {payment.amount} {payment.currency}
                        </Text>
                        <Text
                            style={{
                                textAlign: "center",
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 14,
                                color: theme.COLORS.bodyTextColor,
                                marginBottom: 8,
                            }}
                        >
                            {t.network.networkLabel}{" "}
                            {networkLabel}
                            {payment.network ? ` (${payment.network})` : ""}
                        </Text>
                        {payment.reference && (
                            <Text
                                style={{
                                    textAlign: "center",
                                    ...theme.FONTS.Mulish_400Regular,
                                    fontSize: 16,
                                    color: theme.COLORS.bodyTextColor,
                                    marginBottom: 16,
                                }}
                            >
                                {t.network.refLabel} {payment.reference}
                            </Text>
                        )}
                        {payment.failureReason && (
                            <Text
                                style={{
                                    textAlign: "center",
                                    ...theme.FONTS.Mulish_400Regular,
                                    fontSize: 14,
                                    color: "#FF8A71",
                                    marginBottom: 16,
                                }}
                            >
                                {payment.failureReason}
                            </Text>
                        )}

                        {isPending && payment.qrCodeDataUrl && (
                            <Image
                                source={{ uri: payment.qrCodeDataUrl }}
                                style={{
                                    width: "100%",
                                    maxWidth: 220,
                                    aspectRatio: 1,
                                    marginBottom: 16,
                                    backgroundColor: "#fff",
                                    borderRadius: 8,
                                    alignSelf: "center",
                                }}
                            />
                        )}

                        {isPending && (
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                                <ActivityIndicator size="small" color={theme.COLORS.mainDark} style={{ marginRight: 8 }} />
                                <Text style={{ color: theme.COLORS.bodyTextColor }}>{t.transaction.checkingStatus}</Text>
                            </View>
                        )}

                        {isPaid && (
                            <components.Button
                                title={t.transaction.viewDetails}
                                onPress={() => navigation.navigate("TransactionDetails", { payment })}
                                containerStyle={{ width: "100%", marginBottom: 12 }}
                            />
                        )}

                        {isPending && (
                            <components.Button
                                title={cancelling ? t.transaction.cancelling : t.transaction.cancelPayment}
                                onPress={handleCancel}
                                containerStyle={{ width: "100%", marginBottom: 12 }}
                            />
                        )}

                        <components.Button
                            title={isPaid ? t.transaction.backToDashboard : t.common.done}
                            onPress={() => navigation.navigate("Dashboard")}
                            containerStyle={{ width: "100%", marginBottom: 20 }}
                        />
                    </components.MerchantContent>
                </components.ScreenScroll>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        ...StyleSheet.absoluteFill,
        height: 530,
        top: 90,
    },
});

export default InvoiceSent;
