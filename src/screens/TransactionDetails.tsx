import { Text, View, Image, ActivityIndicator, Alert, Platform, StyleSheet } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { theme } from "../constants";
import { api, PaymentRequest } from "../services/api";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { useTranslation } from "../hooks/useTranslation";
import { formatMessage } from "../i18n";

const TransactionDetails: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const tabBarInset = useTabBarInset();
    const paymentId: string | undefined = route.params?.paymentId;
    const initial: PaymentRequest | undefined = route.params?.payment;
    const [payment, setPayment] = useState<PaymentRequest | null>(initial || null);
    const [loading, setLoading] = useState(!initial && !!paymentId);

    const statusMeta: Record<string, { label: string; color: string }> = {
        PAID: { label: t.payment.statusSuccess, color: theme.COLORS.green },
        PENDING: { label: t.payment.statusWaiting, color: "#EECC55" },
        EXPIRED: { label: t.payment.statusExpired, color: "#FF8A71" },
        FAILED: { label: t.payment.statusFailed, color: "#FF8A71" },
        CANCELLED: { label: t.payment.statusCancelled, color: "#868698" },
    };

    const copyText = useCallback(
        async (label: string, value: string) => {
            try {
                if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
                    await navigator.clipboard.writeText(value);
                } else {
                    Alert.alert(label, value);
                    return;
                }
                Alert.alert(
                    t.transaction.copied,
                    formatMessage(t.transaction.copiedToClipboard, { label })
                );
            } catch {
                Alert.alert(t.transaction.copyFailed, t.transaction.couldNotCopy);
            }
        },
        [t]
    );

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
                    {t.transaction.paymentNotFound}
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
            <Image source={require("../assets/bg/04.png")} style={styles.background} />
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header goBack={true} />
                <components.ScreenScroll
                    withTabBarInset={false}
                    contentContainerStyle={{ paddingBottom: tabBarInset }}
                >
                    <components.MerchantContent>
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
                            {payment.reference || t.payment.usdtPayment}
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
                        <View style={{ marginBottom: 24 }}>
                            <DetailItem leftTitle={t.transaction.paymentId} rightTitle={payment.id.slice(0, 8) + "…"} />
                            <DetailItem leftTitle={t.network.field} rightTitle={payment.network} />
                            <DetailItem leftTitle={t.transaction.amount} rightTitle={`${payment.amount} ${payment.currency}`} />
                            {payment.paidAmount && (
                                <DetailItem leftTitle={t.transaction.paidAmount} rightTitle={`${payment.paidAmount} ${payment.currency}`} />
                            )}
                            {payment.txHash && (
                                <DetailItem leftTitle={t.transaction.txHash} rightTitle={payment.txHash.slice(0, 12) + "…"} />
                            )}
                            {payment.failureReason && (
                                <DetailItem leftTitle={t.transaction.note} rightTitle={payment.failureReason} />
                            )}
                            {payment.expiresAt && payment.status === "PENDING" && (
                                <DetailItem
                                    leftTitle={t.transaction.expires}
                                    rightTitle={new Date(payment.expiresAt).toLocaleString()}
                                />
                            )}
                        </View>
                        {payment.status === "PENDING" && (
                            <components.Button
                                title={t.transaction.viewQrStatus}
                                onPress={() => navigation.navigate("InvoiceSent", { payment })}
                                containerStyle={{ marginBottom: 12 }}
                            />
                        )}
                        <components.Button
                            title={t.transaction.copyPaymentId}
                            onPress={() => copyText(t.transaction.paymentId, payment.id)}
                            containerStyle={{ marginBottom: 12 }}
                        />
                        {payment.txHash && (
                            <components.Button
                                title={t.transaction.copyTxHash}
                                onPress={() => copyText(t.transaction.txHash, payment.txHash!)}
                                containerStyle={{ marginBottom: 12 }}
                            />
                        )}
                        <components.Button
                            title={t.common.back}
                            onPress={() => navigation.goBack()}
                            containerStyle={{ marginBottom: 20 }}
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
        height: 400,
    },
});

export default TransactionDetails;
