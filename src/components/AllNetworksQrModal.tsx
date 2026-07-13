import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    Platform,
    TouchableOpacity,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { components } from ".";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DEFAULT_USDT_NETWORK, UsdtNetwork } from "../constants/usdtNetworks";
import { buildReceiveQrPayload } from "../utils/walletQrPayload";
import { formatUsdtAmount } from "../utils/formatAmount";

const USDT_LOGO = require("../assets/usdt-logo.png");

type Props = {
    visible: boolean;
    onClose: () => void;
    addresses: Partial<Record<UsdtNetwork, string>>;
    amount?: number | null;
    defaultNetwork?: UsdtNetwork;
    fallbackAddress?: string;
    businessName?: string;
};

const AllNetworksQrModal: React.FC<Props> = ({
    visible,
    onClose,
    addresses,
    amount: initialAmount = null,
    defaultNetwork = DEFAULT_USDT_NETWORK,
    fallbackAddress = "",
    businessName,
}) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [amountText, setAmountText] = useState("");

    useEffect(() => {
        if (!visible) return;
        setAmountText(initialAmount != null && initialAmount > 0 ? String(initialAmount) : "");
    }, [visible, initialAmount]);

    const parsedAmount = useMemo(() => {
        const value = parseFloat(amountText.replace(",", "."));
        return Number.isFinite(value) && value > 0 ? value : null;
    }, [amountText]);

    const qrValue = useMemo(() => {
        const fallback = fallbackAddress.trim() || Object.values(addresses).find(Boolean)?.trim() || "";
        if (!fallback) return "";
        return buildReceiveQrPayload({
            addresses,
            amount: parsedAmount,
            asset: "USDT",
            network: defaultNetwork,
            fallbackAddress: fallback,
            businessName,
        });
    }, [addresses, businessName, defaultNetwork, fallbackAddress, parsedAmount]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    justifyContent: "center",
                    padding: 24,
                },
                card: {
                    backgroundColor: colors.bgColor,
                    borderRadius: 16,
                    padding: 20,
                },
                title: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    marginBottom: 8,
                    textAlign: "center",
                },
                desc: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 16,
                    lineHeight: 14 * 1.5,
                },
                amountLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    marginBottom: 8,
                },
                amountInput: {
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 18,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 8,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
                amountHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 12,
                    lineHeight: 12 * 1.5,
                },
                clearAmount: {
                    alignSelf: "center",
                    marginBottom: 12,
                },
                clearAmountText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.linkColor,
                },
                qrWrap: {
                    alignSelf: "center",
                    backgroundColor: colors.white,
                    padding: 14,
                    borderRadius: 16,
                    marginBottom: 16,
                },
                unavailable: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    padding: 24,
                },
            }),
        [FONTS, colors]
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>{t.wallet.myQrCodeTitle}</Text>
                        <Text style={styles.desc}>{t.wallet.myQrCodeDescription}</Text>

                        <Text style={styles.amountLabel}>{t.wallet.setAmountTitle}</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amountText}
                            onChangeText={setAmountText}
                            placeholder={t.wallet.amountPlaceholder}
                            placeholderTextColor={colors.bodyTextColor}
                            keyboardType="decimal-pad"
                        />
                        <Text style={styles.amountHint}>{t.wallet.myQrCodeAmountHint}</Text>
                        {parsedAmount != null ? (
                            <TouchableOpacity
                                style={styles.clearAmount}
                                onPress={() => setAmountText("")}
                                accessibilityRole="button"
                            >
                                <Text style={styles.clearAmountText}>{t.wallet.clearAmount}</Text>
                            </TouchableOpacity>
                        ) : null}

                        {parsedAmount != null ? (
                            <Text style={[styles.amountHint, { color: colors.linkColor, marginBottom: 12 }]}>
                                {formatUsdtAmount(parsedAmount, dateLocale)} USDT
                            </Text>
                        ) : null}

                        <View style={styles.qrWrap}>
                            {qrValue ? (
                                <QRCode
                                    value={qrValue}
                                    size={240}
                                    ecl="L"
                                    logo={USDT_LOGO}
                                    logoSize={40}
                                    logoBackgroundColor={colors.white}
                                    logoMargin={3}
                                    quietZone={6}
                                />
                            ) : (
                                <Text style={styles.unavailable}>{t.wallet.addressUnavailable}</Text>
                            )}
                        </View>
                        <components.Button title={t.common.done} onPress={onClose} />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

export default AllNetworksQrModal;
