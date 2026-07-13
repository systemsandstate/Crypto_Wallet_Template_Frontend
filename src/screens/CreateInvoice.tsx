import { Text, View, StyleSheet, Platform } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useState, useCallback, useMemo } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";

import { components } from "../components";
import DashboardTransactionRow from "../components/DashboardTransactionRow";
import { svg } from "../svg";
import { api, PaymentRequest } from "../services/api";
import { DEFAULT_USDT_NETWORK } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DENSITY } from "../constants/density";
import { appAlert } from "../utils/appAlert";
import { formatUsdtAmount } from "../utils/formatAmount";

const RECENT_REQUEST_LIMIT = 5;

const CreateInvoice: React.FC = () => {
    const navigation: any = useNavigation();
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [amount, setAmount] = useState("");
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);
    const [recentRequests, setRecentRequests] = useState<PaymentRequest[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                content: {
                    paddingTop: DENSITY.sectionGap,
                    paddingBottom: 16,
                    gap: DENSITY.sectionGap,
                },
                card: {
                    width: "100%",
                    backgroundColor: colors.white,
                    borderRadius: DENSITY.cardRadius,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: DENSITY.cardPaddingH,
                    paddingVertical: DENSITY.cardPadding,
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" } as object)
                        : { elevation: 2 }),
                },
                cardTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                    marginBottom: 4,
                },
                cardSubtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors.bodyTextColor,
                    marginBottom: 14,
                },
                sectionHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 6,
                    marginBottom: 2,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                sectionTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: DENSITY.sectionTitle,
                    color: colors.mainDark,
                },
                emptyText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    paddingVertical: 16,
                },
                loadingRecent: {
                    marginVertical: 12,
                },
            }),
        [FONTS, colors]
    );

    const loadRecentRequests = useCallback(async () => {
        setLoadingRecent(true);
        try {
            const result = await api.listPayments({ limit: 20 });
            const requests = (result.data.items ?? [])
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .slice(0, RECENT_REQUEST_LIMIT);

            setRecentRequests(requests);
        } catch {
            setRecentRequests([]);
        } finally {
            setLoadingRecent(false);
        }
    }, []);

    const { reload, hasLoadedRef } = useInitialScreenLoad(loadRecentRequests);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedRef.current) return;
            void reload();
        }, [hasLoadedRef, reload])
    );

    const formatTime = useCallback(
        (iso: string) =>
            new Date(iso).toLocaleString(dateLocale, {
                dateStyle: "medium",
                timeStyle: "short",
            }),
        [dateLocale]
    );

    const getStatusLabel = useCallback(
        (status: string) => {
            switch (status) {
                case "PAID":
                    return t.payment.statusPaid;
                case "PENDING":
                    return t.payment.statusWaiting;
                case "EXPIRED":
                    return t.payment.statusExpired;
                case "CANCELLED":
                    return t.payment.statusCancelled;
                case "FAILED":
                    return t.payment.statusFailed;
                default:
                    return status;
            }
        },
        [t.payment]
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
                network: DEFAULT_USDT_NETWORK,
            });
            navigation.navigate("InvoiceSent", { payment: res.data });
        } catch (err: any) {
            appAlert.alert(t.payment.paymentFailed, err.message || t.payment.createFailed);
        } finally {
            setLoading(false);
        }
    };

    const renderRecentRequest = (payment: PaymentRequest) => {
        const name = payment.reference?.trim() || t.payment.paymentRequestDefault;
        const isPaid = payment.status === "PAID";
        const formatted = formatUsdtAmount(payment.amount, dateLocale);
        const statusLabel = getStatusLabel(payment.status);

        return (
            <DashboardTransactionRow
                key={payment.id}
                name={name}
                timeLabel={`${statusLabel} · ${formatTime(payment.paidAt || payment.createdAt)}`}
                amountLabel={isPaid ? `+$${formatted}` : `$${formatted}`}
                isCredit={isPaid}
                onPress={() =>
                    navigation.navigate("TransactionDetails", {
                        payment,
                        paymentId: payment.id,
                    })
                }
            />
        );
    };

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.payment.createTitle} goBack border />
                <components.FormScrollView
                    withTabBarInset
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <components.MerchantContent style={styles.content}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{t.payment.newPayment}</Text>
                            <Text style={styles.cardSubtitle}>{t.payment.createDescription}</Text>

                            <components.AuthLabeledField
                                label={t.payment.amountLabel}
                                placeholder={t.payment.amountPlaceholder}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                            <components.AuthLabeledField
                                label={t.payment.referenceLabel}
                                placeholder={t.payment.referencePlaceholder}
                                hint={t.payment.referenceHint}
                                value={reference}
                                onChangeText={setReference}
                                fieldStyle={{ marginBottom: 16 }}
                            />

                            {loading ? (
                                <LoadingSpinner size={40} />
                            ) : (
                                <components.Button
                                    title={t.payment.generateQr}
                                    onPress={handleCreate}
                                    leading={<svg.QrCodeSvg size={20} color={colors.white} />}
                                />
                            )}
                        </View>

                        <View style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t.payment.recentRequests}</Text>
                            </View>
                            {loadingRecent ? (
                                <LoadingSpinner size={32} style={styles.loadingRecent} />
                            ) : recentRequests.length === 0 ? (
                                <Text style={styles.emptyText}>{t.payment.noRecentRequests}</Text>
                            ) : (
                                recentRequests.map(renderRecentRequest)
                            )}
                        </View>
                    </components.MerchantContent>
                </components.FormScrollView>
            </SafeAreaView>
        </View>
    );
};

export default CreateInvoice;
