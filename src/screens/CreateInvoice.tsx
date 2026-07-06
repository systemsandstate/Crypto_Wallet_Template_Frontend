import { Text, View} from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { components } from "../components";
import { svg } from "../svg";
import { api, PaymentRequest } from "../services/api";
import { UsdtNetwork, formatUsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { appAlert } from '../utils/appAlert';

const CreateInvoice: React.FC = () => {
    const navigation: any = useNavigation();
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
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
            appAlert.alert(t.common.error, t.payment.invalidAmount);
            return;
        }

        try {
            const walletStatus = await api.getWalletStatus();
            if (!walletStatus.data.hasWallet) {
                appAlert.alert(t.wallet.walletRequired, t.wallet.walletRequiredMessage, [
                    { text: t.common.cancel, style: "cancel" },
                    { text: t.wallet.setupWallet, onPress: () => navigation.navigate("WalletSetup") },
                ]);
                return;
            }
        } catch {
            // proceed — backend will reject if no wallet
        }

        setLoading(true);
        try {
            const res = await api.createPayment({
                amount: num,
                reference: reference.trim() || undefined,
                network});
            navigation.navigate("InvoiceSent", { payment: res.data });
        } catch (err: any) {
            appAlert.alert(t.payment.paymentFailed, err.message || t.payment.createFailed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header
                    title={t.payment.createTitle}
                    goBack={true}
                />
                <components.FormScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <components.MerchantContent style={{ paddingTop: 20, paddingBottom: 16 }}>
                    <Text
                        style={{
                            textAlign: "center",
                            ...FONTS.H2,
                            color: colors.mainDark,
                            marginTop: 20,
                            marginBottom: 8}}
                    >
                        {t.payment.newPayment}
                    </Text>
                    <Text
                        style={{
                            ...FONTS.Mulish_400Regular,
                            fontSize: 14,
                            color: colors.bodyTextColor,
                            marginBottom: 24,
                            textAlign: "center",
                            lineHeight: 14 * 1.6}}
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
                        hint={t.payment.referenceHint}
                        value={reference}
                        onChangeText={setReference}
                        containerStyle={{ marginBottom: 14 }}
                    />
                    <Text
                        style={{
                            ...FONTS.Mulish_400Regular,
                            fontSize: 12,
                            color: colors.bodyTextColor,
                            marginBottom: 24}}
                    >
                        {formatUsdtNetwork(network)}
                    </Text>
                    {loading ? (
                        <LoadingSpinner size={48} />
                    ) : (
                        <components.Button
                            title={t.payment.generateQr}
                            onPress={handleCreate}
                            containerStyle={{ marginBottom: 28 }}
                            leading={<svg.QrCodeSvg size={20} color={colors.white} />}
                        />
                    )}

                    <View
                        style={{
                            borderTopWidth: 1,
                            borderTopColor: "#E8ECF0",
                            paddingTop: 20}}
                    >
                        <Text style={{ ...FONTS.H4, color: colors.mainDark, marginBottom: 12 }}>
                            {t.payment.recentPayments}
                        </Text>
                        {loadingRecent ? (
                            <LoadingSpinner size={40} style={{ marginVertical: 16 }} />
                        ) : recentPayments.length === 0 ? (
                            <Text
                                style={{
                                    color: colors.bodyTextColor,
                                    textAlign: "center",
                                    paddingVertical: 16,
                                    fontSize: 14}}
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
                                            paymentId: item.id})
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

export default CreateInvoice;
