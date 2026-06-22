import { Text, View, ActivityIndicator, Alert, Image, StyleSheet } from "react-native";
import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { components } from "../components";
import { svg } from "../svg";
import { theme } from "../constants";
import { api, PaymentRequest } from "../services/api";
import { UsdtNetwork, formatUsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";

const CreateInvoice: React.FC = () => {
    const navigation: any = useNavigation();
    const { t } = useTranslation();
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
            Alert.alert(t.common.error, t.payment.invalidAmount);
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
            Alert.alert(t.payment.paymentFailed, err.message || t.payment.createFailed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <Image
                source={require("../assets/bg-01.png")}
                style={styles.background}
            />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header
                    title={t.payment.createTitle}
                    goBack={true}
                    goBackColor={theme.COLORS.white}
                    titleStyle={{ color: theme.COLORS.white }}
                    languageTone="on-dark"
                />
                <components.FormScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <components.MerchantContent style={{ paddingTop: 20, paddingBottom: 16 }}>
                    <Text
                        style={{
                            textAlign: "center",
                            ...theme.FONTS.H2,
                            color: theme.COLORS.mainDark,
                            marginTop: 20,
                            marginBottom: 8,
                        }}
                    >
                        {t.payment.newPayment}
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
                        {t.payment.createDescription}
                    </Text>
                    <components.NetworkSelector value={network} onChange={setNetwork} />
                    <components.InputField
                        placeholder={t.payment.amountPlaceholder}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        containerStyle={{ marginBottom: 14 }}
                    />
                    <components.InputField
                        placeholder={t.payment.referencePlaceholder}
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
                            title={t.payment.generateQr}
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
                            {t.payment.recentPayments}
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
                                {t.payment.noRecentPayments}
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
                    </components.MerchantContent>
                </components.FormScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        ...StyleSheet.absoluteFill,
        height: 350,
        zIndex: -1,
    },
});

export default CreateInvoice;
