import { View, Text, Image, StyleSheet } from "react-native";
import PaymentRequestQrPanel from "../components/PaymentRequestQrPanel";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { PaymentRequest } from "../services/api";
import { subscribePaymentStream } from "../services/paymentStream";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { formatUsdtAmount } from "../utils/formatAmount";
import { showToast } from "../utils/toast";
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";

const InvoiceSent: React.FC = ({ navigation, route }: any) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const initial: PaymentRequest = route.params?.payment;
    const [payment, setPayment] = useState<PaymentRequest | null>(initial || null);
    const notifiedPaid = useRef(initial?.status === "PAID");

    const isPaid = payment?.status === "PAID";
    const isPending = payment?.status === "PENDING";

    useEffect(() => {
        if (!payment || payment.status !== "PENDING") return;

        return subscribePaymentStream(payment.id, (updated) => {
            setPayment(updated);
            if (updated.status === "PAID" && !notifiedPaid.current) {
                notifiedPaid.current = true;
                showToast(
                    `${t.payment.statusSuccess}: ${formatUsdtAmount(updated.amount, dateLocale)} ${updated.currency}`,
                    "success"
                );
                triggerDashboardRefresh();
            }
        });
    }, [payment?.id, payment?.status, dateLocale, t.payment.statusSuccess]);

    const getStatusTitle = () => {
        if (!payment) return "";
        if (payment.status === "PAID") return t.payment.statusSuccess + "!";
        if (payment.status === "PENDING") return t.transaction.waitingForPayment;
        if (payment.status === "CANCELLED") return t.payment.statusCancelled;
        if (payment.status === "EXPIRED") return t.payment.statusExpired;
        return t.payment.paymentFailed;
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                scrollContent: {
                    paddingTop: 8,
                    paddingBottom: 24,
                },
                heroIcon: {
                    alignSelf: "center",
                    marginBottom: 16,
                    maxWidth: "70%",
                    resizeMode: "contain",
                },
                heroIconPending: {
                    width: 72,
                    height: 72,
                },
                heroIconPaid: {
                    width: 161,
                    height: 150,
                },
                title: {
                    textAlign: "center",
                    ...FONTS.H2,
                    marginBottom: 8,
                },
                amount: {
                    textAlign: "center",
                    ...FONTS.Mulish_700Bold,
                    fontSize: 28,
                    color: colors.mainDark,
                    marginBottom: 8,
                },
                hint: {
                    textAlign: "center",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginBottom: 12,
                    paddingHorizontal: 8,
                    lineHeight: 20,
                },
                reference: {
                    textAlign: "center",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    marginBottom: 16,
                },
                qrSection: {
                    width: "100%",
                    marginBottom: 16,
                },
                statusRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                },
            }),
        [FONTS, colors]
    );

    if (!payment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgColor, justifyContent: "center", alignItems: "center" }}>
                <Text>{t.transaction.noPaymentData}</Text>
            </SafeAreaView>
        );
    }

    const amountLabel = `${formatUsdtAmount(payment.amount, dateLocale)} ${payment.currency}`;
    const networkLabel = (USDT_NETWORKS as readonly string[]).includes(payment.network)
        ? getLocalizedNetworkLabel(payment.network as UsdtNetwork, t)
        : payment.network;

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header goBack={true} />
                <components.ScreenScroll contentContainerStyle={styles.scrollContent}>
                    <components.MerchantContent style={{ alignItems: "center" }}>
                        <Image
                            source={
                                isPaid
                                    ? require("../assets/other-icons/21.png")
                                    : require("../assets/icons/26.png")
                            }
                            style={[
                                styles.heroIcon,
                                isPaid ? styles.heroIconPaid : styles.heroIconPending,
                            ]}
                        />
                        <Text
                            style={[
                                styles.title,
                                { color: isPaid ? colors.green : colors.mainDark },
                            ]}
                        >
                            {getStatusTitle()}
                        </Text>
                        <Text style={styles.amount}>{amountLabel}</Text>

                        {isPaid ? (
                            <Text style={styles.hint}>
                                {formatMessage(t.payment.paidViaNetwork, { network: networkLabel })}
                            </Text>
                        ) : null}

                        {payment.reference ? (
                            <Text style={styles.reference}>
                                {t.network.refLabel} {payment.reference}
                            </Text>
                        ) : null}

                        {payment.failureReason ? (
                            <Text
                                style={{
                                    textAlign: "center",
                                    ...FONTS.Mulish_400Regular,
                                    fontSize: 14,
                                    color: "#FF8A71",
                                    marginBottom: 16,
                                }}
                            >
                                {payment.failureReason}
                            </Text>
                        ) : null}

                        {isPending ? (
                            <View style={styles.qrSection}>
                                <PaymentRequestQrPanel payment={payment} />
                            </View>
                        ) : null}

                        {isPending ? (
                            <View style={styles.statusRow}>
                                <LoadingSpinner size={24} style={{ marginRight: 8 }} />
                                <Text style={{ color: colors.bodyTextColor }}>
                                    {t.transaction.checkingStatus}
                                </Text>
                            </View>
                        ) : null}

                        {isPaid ? (
                            <components.Button
                                title={t.transaction.viewDetails}
                                onPress={() => navigation.navigate("TransactionDetails", { payment })}
                                containerStyle={{ marginTop: 16 }}
                            />
                        ) : null}
                    </components.MerchantContent>
                </components.ScreenScroll>
            </SafeAreaView>
        </View>
    );
};

export default InvoiceSent;
