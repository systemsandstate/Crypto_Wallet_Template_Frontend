import { Text, TouchableOpacity, ActivityIndicator, ScrollView, View } from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { components } from "../components";
import { theme } from "../constants";
import { api, PaymentRequest } from "../services/api";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { RootState } from "../store/store";

const FILTERS = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Paid", value: "PAID" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Failed", value: "FAILED" },
    { label: "Cancelled", value: "CANCELLED" },
];

const TransactionHistory: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    const load = useCallback(() => {
        setLoading(true);
        api.listPayments({ status: filter || undefined, limit: 50 })
            .then((res) => setPayments(res.data.items))
            .catch(() => setPayments([]))
            .finally(() => setLoading(false));
    }, [filter]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const filterChips = (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
            {FILTERS.map((f) => (
                <TouchableOpacity
                    key={f.value || "all"}
                    onPress={() => setFilter(f.value)}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginRight: 8,
                        backgroundColor: filter === f.value ? theme.COLORS.white : "rgba(255,255,255,0.14)",
                    }}
                >
                    <Text
                        style={{
                            color: filter === f.value ? theme.COLORS.mainDark : theme.COLORS.white,
                            fontSize: 13,
                            ...theme.FONTS.Mulish_600SemiBold,
                        }}
                    >
                        {f.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const listBody = (
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: embedded ? TAB_BAR_HEIGHT + 16 : 24 }}>
            {loading ? (
                <ActivityIndicator color={theme.COLORS.mainDark} style={{ marginTop: 40 }} />
            ) : payments.length === 0 ? (
                <View
                    style={{
                        backgroundColor: theme.COLORS.white,
                        borderRadius: 14,
                        paddingVertical: 32,
                        paddingHorizontal: 20,
                        alignItems: "center",
                        shadowColor: "#062664",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 3,
                    }}
                >
                    <Text style={{ textAlign: "center", color: theme.COLORS.bodyTextColor, fontSize: 14 }}>
                        No payments found.
                    </Text>
                </View>
            ) : (
                payments.map((item) => (
                    <components.PaymentListItem
                        key={item.id}
                        item={item}
                        showDate
                        onPress={() =>
                            navigation.navigate("TransactionDetails", { payment: item, paymentId: item.id })
                        }
                    />
                ))
            )}
        </View>
    );

    if (embedded) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
                <components.MerchantTabHeader
                    eyebrow={merchant?.businessName || "Merchant"}
                    title="Payment history"
                    subtitle="USDT · Multi-chain"
                >
                    {filterChips}
                </components.MerchantTabHeader>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                    {listBody}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <components.Header title="Payment history" goBack={true} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {FILTERS.map((f) => (
                            <TouchableOpacity
                                key={f.value || "all"}
                                onPress={() => setFilter(f.value)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    marginRight: 8,
                                    backgroundColor: filter === f.value ? theme.COLORS.mainDark : theme.COLORS.white,
                                }}
                            >
                                <Text
                                    style={{
                                        color: filter === f.value ? theme.COLORS.white : theme.COLORS.mainDark,
                                        fontSize: 13,
                                    }}
                                >
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {listBody}
            </ScrollView>
        </View>
    );
};

export default TransactionHistory;
