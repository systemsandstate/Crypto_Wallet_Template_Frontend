import { Text, TouchableOpacity, ActivityIndicator, ScrollView, View } from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { components } from "../components";
import { theme } from "../constants";
import { api, PaymentRequest } from "../services/api";
import { RootState } from "../store/store";
import { useTranslation } from "../hooks/useTranslation";

const TransactionHistory: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
    const navigation: any = useNavigation();
    const { t } = useTranslation();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    const filters = [
        { label: t.payment.filterAll, value: "" },
        { label: t.payment.filterPending, value: "PENDING" },
        { label: t.payment.filterPaid, value: "PAID" },
        { label: t.payment.filterExpired, value: "EXPIRED" },
        { label: t.payment.filterFailed, value: "FAILED" },
        { label: t.payment.filterCancelled, value: "CANCELLED" },
    ];

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
            {filters.map((f) => (
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
        <components.MerchantContent style={{ paddingTop: 16, paddingBottom: embedded ? 0 : 24 }}>
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
                        {t.payment.noHistory}
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
        </components.MerchantContent>
    );

    if (embedded) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
                <components.MerchantTabHeader
                    eyebrow={merchant?.businessName || t.common.merchant}
                    title={t.payment.historyTitle}
                    subtitle={t.payment.historySubtitle}
                >
                    {filterChips}
                </components.MerchantTabHeader>
                <components.ScreenScroll>{listBody}</components.ScreenScroll>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <components.Header title={t.payment.historyTitle} goBack={true} />
            <components.ScreenScroll withTabBarInset={false}>
                <components.MerchantContent style={{ paddingTop: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {filters.map((f) => (
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
                </components.MerchantContent>
                {listBody}
            </components.ScreenScroll>
        </View>
    );
};

export default TransactionHistory;
