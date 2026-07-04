import {
    Text,
    View,
    Alert,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    Pressable,
    Platform,
} from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

import { isAddress } from "ethers";

import { components } from "../components";
import QrScanModal from "../components/QrScanModal";
import WithdrawConfirmModal from "../components/WithdrawConfirmModal";
import SendProgressOverlay, { SendProgressStep } from "../components/SendProgressOverlay";
import { USDT_NETWORKS, UsdtNetwork, NATIVE_SYMBOLS, ReceiveAsset } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { showToast } from "../utils/toast";
import { svg } from "../svg";
import { api } from "../services/api";
import { sendUsdt, WalletSendError as UsdtSendError } from "../services/wallet/walletSendService";
import { sendNative, WalletSendError as NativeSendError } from "../services/wallet/walletNativeSendService";
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";
import { toPlainLanguageError } from "../utils/plainLanguageErrors";

const SUPPORTED_SEND_NETWORKS: UsdtNetwork[] = ["ERC20", "BEP20", "POLYGON"];

type WithdrawRouteParams = {
    pickedAddress?: string;
    pickedNetwork?: UsdtNetwork;
    network?: UsdtNetwork;
    asset?: ReceiveAsset;
};

const Withdraw: React.FC = ({ navigation }: any) => {
    const { t, locale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const route = useRoute();
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [network, setNetwork] = useState<UsdtNetwork>("BEP20");
    const [scanVisible, setScanVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendProgressVisible, setSendProgressVisible] = useState(false);
    const [sendStep, setSendStep] = useState<SendProgressStep>("preparing");
    const [networkPickerVisible, setNetworkPickerVisible] = useState(false);
    const [amountFocused, setAmountFocused] = useState(false);
    const [networkBalances, setNetworkBalances] = useState<Record<string, number | null>>({});
    const [nativeBalances, setNativeBalances] = useState<Record<string, number | null>>({});
    const [asset, setAsset] = useState<ReceiveAsset>("USDT");

    const dateLocale = locale === "es" ? "es-ES" : "en-US";
    const isNativeSend = asset === "NATIVE";
    const currencyLabel = isNativeSend ? NATIVE_SYMBOLS[network] : "USDT";
    const screenTitle = isNativeSend ? t.withdraw.sendNativeTitle : t.withdraw.title;

    useFocusEffect(
        useCallback(() => {
            const params = route.params as WithdrawRouteParams | undefined;
            if (params?.asset) {
                setAsset(params.asset);
            }
            if (params?.network) {
                setNetwork(params.network);
                navigation.setParams({ network: undefined });
            }
            if (params?.pickedAddress) {
                setAddress(params.pickedAddress);
                if (params.pickedNetwork) {
                    setNetwork(params.pickedNetwork);
                }
                navigation.setParams({ pickedAddress: undefined, pickedNetwork: undefined });
            }
            api.getWalletBalances()
                .then((res) => {
                    const usdtMap: Record<string, number | null> = {};
                    const nativeMap: Record<string, number | null> = {};
                    for (const row of res.data.balances) {
                        usdtMap[row.network] = row.usdtBalance;
                        nativeMap[row.network] = row.nativeBalance;
                    }
                    setNetworkBalances(usdtMap);
                    setNativeBalances(nativeMap);
                })
                .catch(() => {
                    setNetworkBalances({});
                    setNativeBalances({});
                });
        }, [navigation, route.params])
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                description: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginBottom: 20,
                    lineHeight: 14 * 1.6,
                },
                fieldBlock: {
                    marginBottom: 18,
                },
                fieldLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginBottom: 8,
                },
                addressField: {
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 52,
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    paddingLeft: 14,
                    paddingRight: 6,
                },
                addressInput: {
                    flex: 1,
                    minWidth: 0,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.mainDark,
                    paddingVertical: 12,
                    ...(Platform.OS === "web"
                        ? ({
                              outlineStyle: "none",
                              outlineWidth: 0,
                              backgroundColor: "transparent",
                              paddingLeft: 0,
                          } as object)
                        : {}),
                },
                addressActions: {
                    flexDirection: "row",
                    alignItems: "center",
                    flexShrink: 0,
                },
                actionDivider: {
                    width: 1,
                    height: 22,
                    backgroundColor: colors.border,
                    marginHorizontal: 4,
                },
                pasteButton: {
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                },
                pasteText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.accentBlue,
                },
                iconAction: {
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                },
                networkPill: {
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 48,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                },
                networkPillLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    flex: 1,
                    marginLeft: 10,
                },
                chevron: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginLeft: 8,
                },
                feeHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                    marginTop: 10,
                },
                amountField: {
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 52,
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 2,
                    paddingLeft: 14,
                    paddingRight: 10,
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
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: colors.mainDark,
                    paddingVertical: 12,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
                clearButton: {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                },
                clearText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 14,
                },
                currencyTag: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    marginRight: 10,
                },
                maxButton: {
                    paddingHorizontal: 4,
                    paddingVertical: 8,
                },
                maxText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue,
                },
                approxUsd: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginTop: 8,
                },
                sendFooter: {
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.bgColor,
                },
                networkModalBackdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "flex-end",
                },
                networkModalSheet: {
                    backgroundColor: colors.bgColor,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    paddingHorizontal: 20,
                    paddingTop: 16,
                },
                networkModalTitle: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 12,
                },
                networkOption: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                networkOptionLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.mainDark,
                    marginLeft: 10,
                    flex: 1,
                },
            }),
        [FONTS, colors]
    );

    const bottomInset = Math.max(insets.bottom, 12);
    const scrollBottomPadding = 56 + bottomInset;

    const parsedAmount = parseFloat(amount.replace(",", "."));
    const approxUsdText = formatMessage(t.withdraw.approxUsd, {
        amount: (Number.isFinite(parsedAmount) ? parsedAmount : 0).toLocaleString(dateLocale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
    });

    const handlePaste = async () => {
        try {
            let text = "";
            if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.readText) {
                text = await navigator.clipboard.readText();
            } else {
                text = await Clipboard.getStringAsync();
            }
            const trimmed = text.trim();
            if (trimmed) {
                setAddress(trimmed);
            }
        } catch {
            showToast(t.transaction.couldNotCopy, "error");
        }
    };

    const handleMax = () => {
        const balance = isNativeSend ? nativeBalances[network] : networkBalances[network];
        if (balance == null || balance <= 0) {
            showToast(t.wallet.balanceUnavailable, "error");
            return;
        }
        const maxDecimals = isNativeSend ? 8 : 2;
        const factor = 10 ** maxDecimals;
        const floored = Math.floor(balance * factor) / factor;
        setAmount(String(floored));
    };

    const handleSubmit = () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) {
            Alert.alert(t.common.error, t.payment.invalidAmount);
            return;
        }
        if (!address.trim()) {
            Alert.alert(t.common.error, t.withdraw.enterWalletAddress);
            return;
        }
        if (!isAddress(address.trim())) {
            Alert.alert(t.common.error, t.ux.invalidWalletAddress);
            return;
        }
        const balance = isNativeSend ? nativeBalances[network] : networkBalances[network];
        if (balance != null && num > balance) {
            Alert.alert(t.common.error, isNativeSend ? t.ux.insufficientNative : t.ux.insufficientUsdt);
            return;
        }
        if (!SUPPORTED_SEND_NETWORKS.includes(network)) {
            Alert.alert(t.common.error, t.withdraw.networkSendUnsupported);
            return;
        }
        setConfirmVisible(true);
    };

    const handleConfirmSend = async (pin: string) => {
        const num = parseFloat(amount);
        if (!num || num <= 0) return;

        setConfirmVisible(false);
        setSending(true);
        setSendProgressVisible(true);
        setSendStep("preparing");
        try {
            if (isNativeSend) {
                await sendNative({
                    network,
                    toAddress: address.trim(),
                    amount: num,
                    pin,
                    onProgress: (step) => setSendStep(step),
                });
            } else {
                const { txHash, fromAddress } = await sendUsdt({
                    network,
                    toAddress: address.trim(),
                    amount: num,
                    pin,
                    onProgress: (step) => setSendStep(step),
                });
                void api
                    .reportWalletSend({
                        network,
                        txHash,
                        fromAddress,
                        toAddress: address.trim(),
                        amount: num,
                        currency: "USDT",
                    })
                    .catch(() => {});
            }
            setSendStep("done");
            await new Promise((resolve) => setTimeout(resolve, 700));
            setAmount("");
            setAddress("");
            triggerDashboardRefresh();
            showToast(t.ux.sendSuccessPlain, "success");
        } catch (err) {
            const raw =
                err instanceof UsdtSendError || err instanceof NativeSendError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : t.withdraw.sendFailed;
            showToast(toPlainLanguageError(raw, t), "error");
        } finally {
            setSending(false);
            setSendProgressVisible(false);
            setSendStep("preparing");
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={screenTitle} goBack={true} />
                <components.FormScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: scrollBottomPadding }}>
                    <components.MerchantContent style={{ paddingVertical: 16 }}>
                        <Text style={styles.description}>
                            {isNativeSend ? t.withdraw.sendNativeDescription : t.withdraw.description}
                        </Text>

                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>{t.withdraw.addressOrDomainLabel}</Text>
                            <View style={styles.addressField}>
                                <TextInput
                                    style={styles.addressInput}
                                    placeholder={t.withdraw.addressSearchPlaceholder}
                                    placeholderTextColor={colors.placeholder}
                                    value={address}
                                    onChangeText={setAddress}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <View style={styles.addressActions}>
                                    <TouchableOpacity
                                        style={styles.pasteButton}
                                        onPress={handlePaste}
                                        accessibilityRole="button"
                                        accessibilityLabel={t.withdraw.paste}
                                    >
                                        <Text style={styles.pasteText}>{t.withdraw.paste}</Text>
                                    </TouchableOpacity>
                                    <View style={styles.actionDivider} />
                                    <TouchableOpacity
                                        style={styles.iconAction}
                                        onPress={() => navigation.navigate("AddressBookPicker", { network })}
                                        accessibilityRole="button"
                                        accessibilityLabel={t.withdraw.pickFromAddressBook}
                                    >
                                        <svg.AddressBookSvg color={colors.accentBlue} size={22} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconAction}
                                        onPress={() => setScanVisible(true)}
                                        accessibilityRole="button"
                                        accessibilityLabel={t.withdraw.scanQr}
                                    >
                                        <svg.QrCodeSvg color={colors.accentBlue} size={22} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>{t.withdraw.destinationNetwork}</Text>
                            <TouchableOpacity
                                style={styles.networkPill}
                                activeOpacity={0.75}
                                onPress={() => setNetworkPickerVisible(true)}
                                accessibilityRole="button"
                                accessibilityLabel={t.withdraw.selectNetwork}
                            >
                                <components.NetworkLogo network={network} size={24} />
                                <Text style={styles.networkPillLabel}>
                                    {getLocalizedNetworkLabel(network, t)}
                                </Text>
                                <Text style={styles.chevron}>▼</Text>
                            </TouchableOpacity>
                            <Text style={styles.feeHint}>{t.ux.networkFeeExplainer}</Text>
                        </View>

                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>{t.withdraw.amountLabel}</Text>
                            <View
                                style={[
                                    styles.amountField,
                                    amountFocused ? styles.amountFieldFocused : styles.amountFieldBlurred,
                                ]}
                            >
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0"
                                    placeholderTextColor={colors.placeholder}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="decimal-pad"
                                    onFocus={() => setAmountFocused(true)}
                                    onBlur={() => setAmountFocused(false)}
                                />
                                {amount.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.clearButton}
                                        onPress={() => setAmount("")}
                                        accessibilityRole="button"
                                        accessibilityLabel={t.wallet.clearAmount}
                                    >
                                        <Text style={styles.clearText}>×</Text>
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.currencyTag}>{currencyLabel}</Text>
                                <TouchableOpacity
                                    style={styles.maxButton}
                                    onPress={handleMax}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.withdraw.max}
                                >
                                    <Text style={styles.maxText}>{t.withdraw.max}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.approxUsd}>
                                {isNativeSend
                                    ? `${formatMessage(t.withdraw.nativeBalanceAvailable, {
                                          amount: (nativeBalances[network] ?? 0).toLocaleString(dateLocale, {
                                              maximumFractionDigits: 8,
                                          }),
                                          symbol: currencyLabel,
                                      })}`
                                    : approxUsdText}
                            </Text>
                        </View>
                    </components.MerchantContent>
                </components.FormScrollView>

                <View style={[styles.sendFooter, { paddingBottom: bottomInset }]}>
                    <components.Button
                        title={t.withdraw.requestWithdrawal}
                        onPress={handleSubmit}
                        size="compact"
                    />
                </View>
            </SafeAreaView>

            <Modal
                visible={networkPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setNetworkPickerVisible(false)}
            >
                <Pressable style={styles.networkModalBackdrop} onPress={() => setNetworkPickerVisible(false)}>
                    <Pressable
                        style={[styles.networkModalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={styles.networkModalTitle}>{t.withdraw.selectNetwork}</Text>
                        {USDT_NETWORKS.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.networkOption}
                                onPress={() => {
                                    setNetwork(item);
                                    setNetworkPickerVisible(false);
                                }}
                            >
                                <components.NetworkLogo network={item} size={24} />
                                <Text style={styles.networkOptionLabel}>
                                    {getLocalizedNetworkLabel(item, t)} ({item})
                                </Text>
                                {network === item && <svg.CheckSvg />}
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>

            <QrScanModal
                visible={scanVisible}
                onClose={() => setScanVisible(false)}
                onScan={setAddress}
            />
            <WithdrawConfirmModal
                visible={confirmVisible}
                amount={parseFloat(amount) || 0}
                network={network}
                address={address.trim()}
                currency={currencyLabel}
                submitting={sending}
                onClose={() => {
                    if (!sending) setConfirmVisible(false);
                }}
                onConfirm={handleConfirmSend}
            />
            <SendProgressOverlay visible={sendProgressVisible} step={sendStep} />
        </View>
    );
};

export default Withdraw;
