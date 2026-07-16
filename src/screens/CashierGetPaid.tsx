import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Platform,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";

import { components } from "../components";
import LoadingSpinner from "../components/LoadingSpinner";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import { useAppSelector } from "../hooks/useAppSelector";
import { RootState } from "../store/store";
import { DEFAULT_USDT_NETWORK, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { buildWalletQrPayload } from "../utils/walletQrPayload";
import { formatUsdtAmount } from "../utils/formatAmount";
import { DENSITY } from "../constants/density";
import { confirmAction } from "../utils/confirm";
import { navigationRef } from "../navigation/navigationRef";

const USDT_LOGO = require("../assets/usdt-logo.png");

const CashierGetPaid: React.FC = () => {
    const navigation: any = useNavigation();
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<Partial<Record<UsdtNetwork, string>>>({});
    const [amountText, setAmountText] = useState("");
    const [amountFocused, setAmountFocused] = useState(false);

    const loadAddresses = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await prepareWalletContext();
            const map: Partial<Record<UsdtNetwork, string>> = {};
            for (const row of rows) {
                if ((USDT_NETWORKS as readonly string[]).includes(row.network) && row.address?.trim()) {
                    map[row.network as UsdtNetwork] = row.address.trim();
                }
            }
            setAddresses(map);
        } catch {
            setAddresses({});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAddresses();
    }, [loadAddresses]);

    const parsedAmount = useMemo(() => {
        const value = parseFloat(amountText.replace(",", "."));
        return Number.isFinite(value) && value > 0 ? value : null;
    }, [amountText]);

    // One primary address in the QR — Kivoo payers look up the rest via API.
    const qrNetwork: UsdtNetwork =
        addresses[DEFAULT_USDT_NETWORK] ? DEFAULT_USDT_NETWORK : USDT_NETWORKS.find((n) => addresses[n]) || DEFAULT_USDT_NETWORK;
    const receiveAddress = addresses[qrNetwork]?.trim() || "";

    const qrValue = useMemo(() => {
        if (!receiveAddress) return "";
        return buildWalletQrPayload(qrNetwork, receiveAddress, parsedAmount, "USDT");
    }, [parsedAmount, qrNetwork, receiveAddress]);

    const qrSize = Math.min(220, Math.max(168, Math.floor(windowWidth - 96)));

    const openHelp = () => {
        if (navigationRef.isReady()) {
            navigationRef.navigate("WalletHelp");
        }
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                scrollContent: {
                    flexGrow: 1,
                    paddingHorizontal: DENSITY.pagePaddingH,
                    paddingTop: 8,
                    paddingBottom: 24,
                },
                heroAmountLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 10,
                },
                amountField: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "center",
                    width: "100%",
                    maxWidth: 360,
                    minHeight: 64,
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    borderWidth: 2,
                    paddingHorizontal: 14,
                    marginBottom: 8,
                },
                amountFieldFocused: {
                    borderColor: colors.accentBlue,
                },
                amountFieldBlurred: {
                    borderColor: colors.inputBorder,
                },
                amountInput: {
                    flex: 1,
                    minWidth: 0,
                    ...FONTS.Mulish_700Bold,
                    fontSize: 32,
                    color: colors.mainDark,
                    textAlign: "center",
                    paddingVertical: 12,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
                currencyTag: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    marginLeft: 8,
                },
                clearButton: {
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 8,
                },
                clearText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 16,
                },
                amountHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 16,
                    lineHeight: 18,
                },
                qrCard: {
                    alignSelf: "center",
                    backgroundColor: colors.white,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    marginBottom: 16,
                    alignItems: "center",
                    ...(Platform.OS === "web"
                        ? ({ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" } as object)
                        : { elevation: 2 }),
                },
                businessName: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 16,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 12,
                },
                amountBadge: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 18,
                    color: colors.accentBlue,
                    textAlign: "center",
                    marginBottom: 14,
                },
                instruction: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    lineHeight: 20,
                    marginBottom: 20,
                    paddingHorizontal: 12,
                },
                helpLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.accentBlue,
                    textAlign: "center",
                    paddingVertical: 12,
                },
                loadingWrap: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                },
                empty: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 16,
                },
            }),
        [FONTS, colors]
    );

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
                <components.Header title={t.wallet.cashierTitle} goBack border />
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    {loading ? (
                        <View style={styles.loadingWrap}>
                            <LoadingSpinner size={48} />
                        </View>
                    ) : !receiveAddress ? (
                        <View style={styles.loadingWrap}>
                            <Text style={styles.empty}>{t.wallet.selectReceiveNetworkDescription}</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("ReceiveSelect")}
                                accessibilityRole="button"
                            >
                                <Text style={styles.helpLink}>{t.wallet.setupWallet}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.heroAmountLabel}>{t.wallet.cashierAmountLabel}</Text>
                            <View
                                style={[
                                    styles.amountField,
                                    amountFocused ? styles.amountFieldFocused : styles.amountFieldBlurred,
                                ]}
                            >
                                <TextInput
                                    style={styles.amountInput}
                                    value={amountText}
                                    onChangeText={setAmountText}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.placeholder}
                                    keyboardType="decimal-pad"
                                    onFocus={() => setAmountFocused(true)}
                                    onBlur={() => setAmountFocused(false)}
                                    accessibilityLabel={t.wallet.cashierAmountLabel}
                                />
                                <Text style={styles.currencyTag}>USDT</Text>
                                {amountText.length > 0 ? (
                                    <TouchableOpacity
                                        style={styles.clearButton}
                                        onPress={() => setAmountText("")}
                                        accessibilityRole="button"
                                        accessibilityLabel={t.wallet.clearAmount}
                                    >
                                        <Text style={styles.clearText}>×</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <Text style={styles.amountHint}>{t.wallet.cashierAmountHint}</Text>

                            <View style={styles.qrCard}>
                                {merchant?.businessName ? (
                                    <Text style={styles.businessName} numberOfLines={1}>
                                        {merchant.businessName}
                                    </Text>
                                ) : null}
                                {parsedAmount != null ? (
                                    <Text style={styles.amountBadge}>
                                        ${formatUsdtAmount(parsedAmount, dateLocale)} USDT
                                    </Text>
                                ) : null}
                                <QRCode
                                    value={qrValue}
                                    size={qrSize}
                                    ecl="M"
                                    logo={USDT_LOGO}
                                    logoSize={Math.round(qrSize * 0.16)}
                                    logoBackgroundColor={colors.white}
                                    logoMargin={3}
                                    quietZone={8}
                                />
                            </View>

                            <Text style={styles.instruction}>{t.wallet.cashierInstruction}</Text>

                            <components.Button
                                title={t.wallet.cashierDone}
                                onPress={() => navigation.goBack()}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    confirmAction({
                                        title: t.wallet.paymentMissingTitle,
                                        message: t.wallet.paymentMissingMessage,
                                        confirmLabel: t.common.help,
                                        cancelLabel: t.common.cancel,
                                        onConfirm: openHelp,
                                    });
                                }}
                                accessibilityRole="button"
                            >
                                <Text style={styles.helpLink}>{t.wallet.paymentMissingCta}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

export default CashierGetPaid;
