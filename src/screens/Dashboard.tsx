import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";

import { svg } from "../svg";
import { theme } from "../constants";
import { components } from "../components";
import { api, PaymentRequest } from "../services/api";
import { RootState } from "../store/store";
import { setScreen } from "../store/tabSlice";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";

const sumAmounts = (items: PaymentRequest[]) =>
    items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);

const Dashboard: React.FC = () => {
    const navigation: any = useNavigation();
    const dispatch = useDispatch();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        paid: 0,
        pendingAmount: 0,
        totalReceived: 0,
    });

    const loadPayments = useCallback(() => {
        setLoading(true);
        api.listPayments({ limit: 100 })
            .then((res) => {
                const items = res.data.items;
                const recent = items.slice(0, 5);
                const pendingItems = items.filter((p) => p.status === "PENDING");
                const paidItems = items.filter((p) => p.status === "PAID");

                setPayments(recent);
                setStats({
                    pending: pendingItems.length,
                    paid: paidItems.length,
                    pendingAmount: sumAmounts(pendingItems),
                    totalReceived: sumAmounts(paidItems),
                });
            })
            .catch(() => {
                setPayments([]);
                setStats({ pending: 0, paid: 0, pendingAmount: 0, totalReceived: 0 });
            })
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPayments();
        }, [loadPayments])
    );

    const accountLabel = merchant?.email
        ? `ACCT · ${merchant.email.split("@")[0].slice(0, 4).toUpperCase()} ****`
        : "MERCHANT ACCOUNT";

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_BAR_HEIGHT + 16 }}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: theme.COLORS.bgColor }}
        >
            <components.MerchantTabHeader
                eyebrow="Welcome back"
                title={merchant?.businessName || "Merchant"}
                subtitle="USDT payments · Multi-chain"
                paddingBottom={72}
            />
            <View style={{ paddingHorizontal: 20, marginTop: -56, marginBottom: 20 }}>
                <components.MerchantBalanceCard
                    businessName={merchant?.businessName || "Merchant"}
                    totalReceived={stats.totalReceived}
                    pendingCount={stats.pending}
                    pendingAmount={stats.pendingAmount}
                    paidCount={stats.paid}
                    accountLabel={accountLabel}
                />
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("CreateInvoice")}
                        style={actionCardStyle}
                    >
                        <View style={[actionIconStyle, { backgroundColor: "#EECC55" }]}>
                            <svg.SafeDepositSvg color={theme.COLORS.white} />
                        </View>
                        <Text style={actionLabelStyle}>Deposit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("FundTransfer")}
                        style={actionCardStyle}
                    >
                        <View style={actionIconPlain}>
                            <svg.TransferSvg />
                        </View>
                        <Text style={actionLabelStyle}>Make transfer</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Withdraw")}
                        style={actionCardStyle}
                    >
                        <View style={[actionIconStyle, { backgroundColor: "#3EB290" }]}>
                            <svg.WalletSvg color={theme.COLORS.white} />
                        </View>
                        <Text style={actionLabelStyle}>Withdraw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => dispatch(setScreen("History"))}
                        style={actionCardStyle}
                    >
                        <View style={[actionIconStyle, { backgroundColor: "#8B7FD4" }]}>
                            <svg.ReportSvg color={theme.COLORS.white} />
                        </View>
                        <Text style={actionLabelStyle}>View history</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
                <Text style={{ ...theme.FONTS.H4, color: theme.COLORS.mainDark, marginBottom: 12 }}>
                    Recent payments
                </Text>
                {loading ? (
                    <ActivityIndicator color={theme.COLORS.mainDark} />
                ) : payments.length === 0 ? (
                    <Text style={{ color: theme.COLORS.bodyTextColor, textAlign: "center", paddingVertical: 24 }}>
                        No payments yet. Tap Deposit to receive your first USDT payment.
                    </Text>
                ) : (
                    payments.map((item) => (
                        <components.PaymentListItem
                            key={item.id}
                            item={item}
                            onPress={() =>
                                navigation.navigate("TransactionDetails", { payment: item, paymentId: item.id })
                            }
                        />
                    ))
                )}
            </View>
        </ScrollView>
    );
};

export default Dashboard;

const actionCardStyle = {
    flex: 1,
    alignItems: "center" as const,
    backgroundColor: theme.COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: "#062664",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
};

const actionIconStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 10,
};

const actionIconPlain = {
    width: 48,
    height: 48,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 10,
};

const actionLabelStyle = {
    ...theme.FONTS.Mulish_600SemiBold,
    fontSize: 12,
    color: theme.COLORS.mainDark,
    textAlign: "center" as const,
};
