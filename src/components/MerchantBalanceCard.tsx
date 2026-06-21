import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Shadow } from "react-native-shadow-2";

import { theme } from "../constants";
import { svg } from "../svg";

type Props = {
    businessName: string;
    totalReceived: number;
    pendingCount: number;
    pendingAmount: number;
    paidCount: number;
    accountLabel?: string;
};

const formatAmount = (value: number) => {
    const safe = Number.isFinite(value) ? value : 0;
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const MerchantBalanceCard: React.FC<Props> = ({
    businessName,
    totalReceived,
    pendingCount,
    pendingAmount,
    paidCount,
    accountLabel,
}) => {
    const [whole, fraction = "00"] = formatAmount(totalReceived).split(".");

    return (
        <Shadow
            distance={18}
            startColor="rgba(6, 38, 100, 0.18)"
            endColor="rgba(6, 38, 100, 0.02)"
            offset={[0, 8]}
            containerStyle={styles.shadowWrap}
            style={styles.card}
        >
            <View style={styles.topRow}>
                <View style={styles.chip}>
                    <View style={styles.chipLine} />
                    <View style={[styles.chipLine, styles.chipLineMid]} />
                    <View style={styles.chipLine} />
                </View>
                <Text style={styles.network}>USDT · Multi-chain</Text>
            </View>

            <Text style={styles.account}>{accountLabel || "Merchant wallet"}</Text>

            <View style={styles.balanceRow}>
                <Text style={styles.balanceWhole}>{whole}</Text>
                <Text style={styles.balanceFraction}>.{fraction}</Text>
                <Text style={styles.balanceCurrency}>USDT</Text>
            </View>

            <Text style={styles.balanceLabel}>Total received</Text>

            <View style={styles.bottomRow}>
                <View style={styles.bottomLeft}>
                    <Text style={styles.metaLabel}>Merchant</Text>
                    <Text style={styles.merchantName} numberOfLines={1}>
                        {(businessName || "Merchant").toUpperCase()}
                    </Text>
                </View>

                <View style={styles.bottomRight}>
                    <View style={styles.statsRow}>
                        <View style={styles.statBlock}>
                            <Text style={styles.metaLabel}>Pending</Text>
                            <Text style={styles.statValue}>{pendingCount}</Text>
                            <Text style={styles.statSub}>{formatAmount(pendingAmount)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBlock}>
                            <Text style={styles.metaLabel}>Paid</Text>
                            <Text style={[styles.statValue, { color: "#7BE0B8" }]}>{paidCount}</Text>
                            <Text style={styles.statSub}>recent</Text>
                        </View>
                    </View>
                    <View style={styles.brandMark}>
                        <svg.UsdtMarkSvg size={28} />
                        <Text style={styles.brandTitle}>USDT</Text>
                    </View>
                </View>
            </View>
        </Shadow>
    );
};

const styles = StyleSheet.create({
    shadowWrap: {
        width: "100%",
    },
    card: {
        width: "100%",
        borderRadius: 18,
        backgroundColor: "#12121C",
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 20,
        overflow: "hidden",
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    chip: {
        width: 38,
        height: 28,
        borderRadius: 5,
        backgroundColor: "#D4AF37",
        paddingHorizontal: 5,
        paddingVertical: 6,
        justifyContent: "space-between",
    },
    chipLine: {
        height: 2,
        borderRadius: 1,
        backgroundColor: "rgba(0,0,0,0.18)",
    },
    chipLineMid: {
        width: "72%",
        alignSelf: "center",
    },
    network: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 11,
        letterSpacing: 1.2,
        color: "rgba(255,255,255,0.72)",
        textTransform: "uppercase",
    },
    account: {
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 13,
        color: "rgba(255,255,255,0.72)",
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    balanceRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 4,
    },
    balanceWhole: {
        ...theme.FONTS.Mulish_700Bold,
        fontSize: 34,
        lineHeight: 38,
        color: theme.COLORS.white,
    },
    balanceFraction: {
        ...theme.FONTS.Mulish_700Bold,
        fontSize: 20,
        lineHeight: 30,
        color: theme.COLORS.white,
        marginBottom: 2,
    },
    balanceCurrency: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginLeft: 8,
        marginBottom: 6,
    },
    balanceLabel: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 9,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: "#959BBF",
        marginBottom: 18,
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
    },
    bottomLeft: {
        flex: 1,
        minWidth: 0,
    },
    bottomRight: {
        alignItems: "flex-end",
    },
    metaLabel: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 8,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#959BBF",
        marginBottom: 4,
    },
    merchantName: {
        ...theme.FONTS.Mulish_700Bold,
        fontSize: 13,
        color: theme.COLORS.white,
        letterSpacing: 0.6,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    statBlock: {
        alignItems: "flex-end",
        minWidth: 54,
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: "rgba(255,255,255,0.14)",
        marginHorizontal: 10,
    },
    statValue: {
        ...theme.FONTS.Mulish_700Bold,
        fontSize: 16,
        color: "#EECC55",
    },
    statSub: {
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 10,
        color: "rgba(255,255,255,0.65)",
    },
    brandMark: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    brandTitle: {
        ...theme.FONTS.Mulish_700Bold,
        fontSize: 11,
        color: theme.COLORS.white,
        letterSpacing: 0.8,
    },
});

export default MerchantBalanceCard;
