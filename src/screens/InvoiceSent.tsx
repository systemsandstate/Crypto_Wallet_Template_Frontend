import { View, Text, Image} from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { api, PaymentRequest } from "../services/api";
import { subscribePaymentStream } from "../services/paymentStream";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { showToast } from "../utils/toast";
import { appAlert } from '../utils/appAlert';
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";

const InvoiceSent: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const initial: PaymentRequest = route.params?.payment;
    const [payment, setPayment] = useState<PaymentRequest | null>(initial || null);
    const [cancelling, setCancelling] = useState(false);
    const notifiedPaid = useRef(initial?.status === "PAID");

    useEffect(() => {
        if (!payment || payment.status !== "PENDING") return;

        return subscribePaymentStream(payment.id, (updated) => {
            setPayment(updated);
            if (updated.status === "PAID" && !notifiedPaid.current) {
                notifiedPaid.current = true;
                showToast(
                    `${t.payment.statusSuccess}: ${updated.amount} ${updated.currency}`,
                    "success"
                );
                triggerDashboardRefresh();
            }
        });
    }, [payment?.id, payment?.status, t.payment.statusSuccess]);

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
        appAlert.alert(t.transaction.cancelPaymentTitle, t.transaction.cancelPaymentConfirm, [
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
                        appAlert.alert(t.common.error, err.message || t.transaction.couldNotCancel);
                    } finally {
                        setCancelling(false);
                    }
                }},
        ]);
    };

    if (!payment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgColor, justifyContent: "center", alignItems: "center" }}>
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
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header goBack={true} />
                <components.ScreenScroll withTabBarInset={false}>
                    <components.MerchantContent style={{ marginTop: 32, alignItems: "center", paddingBottom: 20 }}>
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
                                resizeMode: "contain"}}
                        />
                        <Text
                            style={{
                                textAlign: "center",
                                ...FONTS.H2,
                                color: isPaid ? colors.green : colors.mainDark,
                                marginBottom: 12}}
                        >
                            {getStatusTitle()}
                        </Text>
                        <Text
                            style={{
                                textAlign: "center",
                                ...FONTS.Mulish_700Bold,
                                fontSize: 22,
                                color: colors.mainDark,
                                marginBottom: 8}}
                        >
                            {payment.amount} {payment.currency}
                        </Text>
                        <Text
                            style={{
                                textAlign: "center",
                                ...FONTS.Mulish_400Regular,
                                fontSize: 14,
                                color: colors.bodyTextColor,
                                marginBottom: 8}}
                        >
                            {t.network.networkLabel}{" "}
                            {networkLabel}
                            {payment.network ? ` (${payment.network})` : ""}
                        </Text>
                        {payment.reference && (
                            <Text
                                style={{
                                    textAlign: "center",
                                    ...FONTS.Mulish_400Regular,
                                    fontSize: 16,
                                    color: colors.bodyTextColor,
                                    marginBottom: 16}}
                            >
                                {t.network.refLabel} {payment.reference}
                            </Text>
                        )}
                        {payment.failureReason && (
                            <Text
                                style={{
                                    textAlign: "center",
                                    ...FONTS.Mulish_400Regular,
                                    fontSize: 14,
                                    color: "#FF8A71",
                                    marginBottom: 16}}
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
                                    backgroundColor: colors.white,
                                    borderRadius: 8,
                                    alignSelf: "center"}}
                            />
                        )}

                        {isPending && (payment.depositAddress || payment.paymentUrl) && (
                            <View style={{ marginBottom: 16, width: "100%" }}>
                                <Text
                                    style={{
                                        textAlign: "center",
                                        ...FONTS.Mulish_400Regular,
                                        fontSize: 13,
                                        color: colors.bodyTextColor,
                                        marginBottom: 6}}
                                >
                                    {t.wallet.sendToAddress}
                                </Text>
                                <Text
                                    selectable
                                    style={{
                                        textAlign: "center",
                                        ...FONTS.Mulish_600SemiBold,
                                        fontSize: 12,
                                        color: colors.mainDark,
                                        lineHeight: 18}}
                                >
                                    {payment.depositAddress || payment.paymentUrl}
                                </Text>
                            </View>
                        )}

                        {isPending && (
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                                <LoadingSpinner size={28} style={{ marginRight: 8 }} />
                                <Text style={{ color: colors.bodyTextColor }}>{t.transaction.checkingStatus}</Text>
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
                            onPress={() => navigation.navigate("Home")}
                            containerStyle={{ width: "100%", marginBottom: 20 }}
                        />
                    </components.MerchantContent>
                </components.ScreenScroll>
            </SafeAreaView>
        </View>
    );
};

export default InvoiceSent;
