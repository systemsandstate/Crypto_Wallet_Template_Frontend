import {
    Text,
    View, 
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    Pressable,
    Platform,
    InteractionManager} from "react-native";
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useTabStackFooterLayout } from "../hooks/useTabBarInset";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";
import * as Clipboard from "expo-clipboard";

import { isValidSendAddress } from "../utils/isEvmAddress";
import { appAlert } from '../utils/appAlert';

import { components } from "../components";
import LoadingSpinner from "../components/LoadingSpinner";
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
import { api, ensureAuthToken } from "../services/api";
import { sendUsdt, WalletSendError as UsdtSendError } from "../services/wallet/walletSendService";
import { sendNative, WalletSendError as NativeSendError } from "../services/wallet/walletNativeSendService";
import { usesUsdtGas as networkUsesUsdtGas } from "../config/usdtGas";
import { triggerDashboardRefresh } from "../utils/dashboardRefresh";
import { toPlainLanguageError } from "../utils/plainLanguageErrors";
import {
    resolveNetworkBalanceMap,
    resolveNetworkNativeBalanceMap} from "../utils/walletBalance";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { inferSendNetworkFromAddress, pickDefaultEvmNetwork } from "../utils/inferSendNetwork";
import type { ScannedWalletPayload } from "../utils/parseScannedWalletAddress";
import { buildSendPlan } from "../utils/buildSendPlan";
import type { SendPlan } from "../utils/buildSendPlan";
import LatestTransferLogsList from "../components/LatestTransferLogsList";
import { useLatestTransferLogs, type LatestTransferLog } from "../hooks/useLatestTransferLogs";
import type { RepeatSendPayload } from "../utils/repeatSendTransfer";

type RecipientPreview = {
    kind: "app" | "contact" | "external";
    name: string;
    isSelf?: boolean;
    avatarUrl?: string | null;
};

type WithdrawRouteParams = {
    pickedAddress?: string;
    pickedSendAddress?: string;
    pickedContactName?: string;
    pickedNetwork?: UsdtNetwork;
    network?: UsdtNetwork;
    asset?: ReceiveAsset;
    openScan?: boolean;
    initialSendPlan?: SendPlan;
    openConfirm?: boolean;
    returnScreen?: "Home" | "SendSelect" | "SendFundSelect";
    repeatSend?: RepeatSendPayload;
    lockNetwork?: boolean;
};

const Withdraw: React.FC = ({ navigation }: any) => {
    const { t, locale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const route = useRoute();
    const merchantId = useAppSelector((state) => state.auth.merchant?.id);
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [sendToAddress, setSendToAddress] = useState("");
    const [network, setNetwork] = useState<UsdtNetwork>("BEP20");
    const [scanVisible, setScanVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendProgressVisible, setSendProgressVisible] = useState(false);
    const [sendStep, setSendStep] = useState<SendProgressStep>("preparing");
    const [networkPickerVisible, setNetworkPickerVisible] = useState(false);
    const [networkLocked, setNetworkLocked] = useState(false);
    const [showPaymentMethod, setShowPaymentMethod] = useState(false);
    const [amountFocused, setAmountFocused] = useState(false);
    const [networkBalances, setNetworkBalances] = useState<Record<string, number | null>>({});
    const [nativeBalances, setNativeBalances] = useState<Record<string, number | null>>({});
    const [asset, setAsset] = useState<ReceiveAsset>("USDT");
    const [estimatedFeeUsdt, setEstimatedFeeUsdt] = useState<number | null>(null);
    const [confirmAvailableBalance, setConfirmAvailableBalance] = useState<number | null>(null);
    const [feeLoading, setFeeLoading] = useState(false);
    const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);
    const [scanConfirmLoading, setScanConfirmLoading] = useState(false);
    const pendingRepeatRef = useRef<RepeatSendPayload | null>(null);

    const dateLocale = locale === "es" ? "es-ES" : "en-US";
    const isNativeSend = asset === "NATIVE";
    const { logs: latestTransferLogs, refresh: refreshLatestTransferLogs } =
        useLatestTransferLogs(!isNativeSend);

    const currencyLabel = isNativeSend ? NATIVE_SYMBOLS[network] : "USDT";
    const screenTitle = isNativeSend ? t.withdraw.sendNativeTitle : t.withdraw.title;
    const usesUsdtGas = !isNativeSend && networkUsesUsdtGas(network);

    const balancesLoadedRef = useRef(false);

    const applySendPlan = useCallback((plan: SendPlan) => {
        setAddress(plan.inputLabel);
        setSendToAddress(plan.sendAddress);
        setAmount(String(plan.amount));
        setNetwork(plan.network);
        setRecipientPreview(plan.preview);
        setEstimatedFeeUsdt(plan.feeUsdt);
        setConfirmAvailableBalance(plan.availableBalance);
    }, []);

    useFocusEffect(
        useCallback(() => {
            const params = route.params as WithdrawRouteParams | undefined;
            if (params?.asset) {
                setAsset(params.asset);
            }
            if (params?.lockNetwork) {
                setNetworkLocked(true);
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
                if (params.pickedSendAddress) {
                    setSendToAddress(params.pickedSendAddress);
                    setRecipientPreview({
                        kind: "contact",
                        name:
                            params.pickedContactName?.trim() ||
                            params.pickedAddress.trim(),
                    });
                }
                navigation.setParams({
                    pickedAddress: undefined,
                    pickedNetwork: undefined,
                    pickedSendAddress: undefined,
                    pickedContactName: undefined,
                    lockNetwork: undefined,
                });
            }
            if (params?.openScan) {
                setScanVisible(true);
                navigation.setParams({ openScan: undefined });
            }
            if (params?.initialSendPlan) {
                const plan = params.initialSendPlan;
                const shouldOpenConfirm = params.openConfirm === true;
                applySendPlan(plan);
                navigation.setParams({ initialSendPlan: undefined, openConfirm: undefined });
                if (shouldOpenConfirm) {
                    InteractionManager.runAfterInteractions(() => {
                        setConfirmVisible(true);
                    });
                }
            }
            if (params?.repeatSend) {
                pendingRepeatRef.current = params.repeatSend;
                setNetwork(params.repeatSend.network);
                navigation.setParams({ repeatSend: undefined });
            }
            if (balancesLoadedRef.current) return;
            balancesLoadedRef.current = true;
            void (async () => {
                try {
                    const [activeAddresses, cached] = await Promise.all([
                        prepareWalletContext(),
                        api.getWalletBalances({ live: true }),
                    ]);
                    setNetworkBalances(
                        resolveNetworkBalanceMap(cached.data.balances ?? [], activeAddresses)
                    );
                    setNativeBalances(
                        resolveNetworkNativeBalanceMap(cached.data.balances ?? [], activeAddresses)
                    );
                } catch {
                    setNetworkBalances({});
                    setNativeBalances({});
                }
            })();
        }, [applySendPlan, navigation, route.params])
    );

    const needsManualPaymentMethod =
        !networkLocked &&
        !isNativeSend &&
        /^0x[a-fA-F0-9]{40}$/.test(address.trim()) &&
        recipientPreview?.kind !== "app";

    const styles = useMemo(
        () =>
            StyleSheet.create({
                description: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginBottom: 20,
                    lineHeight: 14 * 1.6},
                fieldBlock: {
                    marginBottom: 18},
                fieldLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginBottom: 8},
                addressField: {
                    minHeight: 52,
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                },
                addressInput: {
                    width: "100%",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.mainDark,
                    paddingVertical: 12,
                    ...(Platform.OS === "web"
                        ? ({
                              outlineStyle: "none",
                              outlineWidth: 0,
                              backgroundColor: "transparent",
                          } as object)
                        : {})},
                addressActionsRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 4,
                },
                actionDivider: {
                    width: 1,
                    height: 22,
                    backgroundColor: colors.border,
                    marginHorizontal: 4},
                pasteButton: {
                    paddingHorizontal: 8,
                    paddingVertical: 10},
                pasteText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.accentBlue},
                iconAction: {
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center"},
                networkLockedRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                networkLockedLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    flex: 1,
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
                    paddingVertical: 10},
                networkPillLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    flex: 1,
                    marginLeft: 10},
                chevron: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginLeft: 8},
                feeHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                    marginTop: 10},
                amountField: {
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 52,
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 2,
                    paddingLeft: 14,
                    paddingRight: 10},
                amountFieldFocused: {
                    borderColor: colors.accentBlue},
                amountFieldBlurred: {
                    borderColor: colors.inputBorder},
                amountInput: {
                    flex: 1,
                    minWidth: 0,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: colors.mainDark,
                    paddingVertical: 12,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {})},
                clearButton: {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8},
                clearText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 14},
                currencyTag: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.bodyTextColor,
                    marginRight: 10},
                maxButton: {
                    paddingHorizontal: 4,
                    paddingVertical: 8},
                maxText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.accentBlue},
                approxUsd: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginTop: 8},
                sendFooter: {
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.bgColor,
                },
                pageBody: {
                    flex: 1,
                },
                pageScroll: {
                    flex: 1,
                    minHeight: 0,
                },
                networkModalBackdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "flex-end"},
                networkModalSheet: {
                    backgroundColor: colors.bgColor,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    paddingHorizontal: 20,
                    paddingTop: 16},
                networkModalTitle: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 12},
                networkOption: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border},
                networkOptionLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.mainDark,
                    marginLeft: 10,
                    flex: 1,
                },
                recipientCard: {
                    marginTop: 10,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                recipientTitle: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: colors.mainDark,
                    marginBottom: 4,
                },
                recipientHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 18,
                },
                recipientBadge: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 10,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: colors.accentBlue,
                    marginBottom: 6,
                },
                paymentMethodLink: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.accentBlue,
                    marginTop: 8,
                }}),
        [FONTS, colors]
    );

    const { footerPaddingBottom, scrollPaddingBottom } = useTabStackFooterLayout({
        buttonHeight: 52,
        footerPaddingTop: 12,
        overlapClearance: 8,
    });

    const parsedAmount = parseFloat(amount.replace(",", "."));
    const approxUsdText = formatMessage(t.withdraw.approxUsd, {
        amount: (Number.isFinite(parsedAmount) ? parsedAmount : 0).toLocaleString(dateLocale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2})});

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

    const runSendPlan = useCallback(
        async (input: {
            recipientInput: string;
            amount: number;
            preferredNetwork: UsdtNetwork;
            sendAsset?: ReceiveAsset;
            qrPayload?: ScannedWalletPayload["qrPayload"];
            notifyErrors?: boolean;
            lockNetwork?: boolean;
        }): Promise<boolean> => {
            setFeeLoading(true);
            setEstimatedFeeUsdt(null);
            setConfirmAvailableBalance(null);
            try {
                const result = await buildSendPlan({
                    recipientInput: input.recipientInput,
                    amount: input.amount,
                    preferredNetwork: input.preferredNetwork,
                    asset: input.sendAsset ?? asset,
                    merchantId,
                    networkBalances,
                    nativeBalances,
                    qrPayload: input.qrPayload,
                    lockNetwork: input.lockNetwork ?? networkLocked,
                    labels: {
                        invalidAmount: t.payment.invalidAmount,
                        missingRecipient: t.withdraw.enterWalletAddress,
                        invalidAddress: t.ux.invalidWalletAddress,
                        emailNotFound: t.withdraw.recipientEmailNotFound,
                        cannotSendToSelf: t.withdraw.cannotSendToSelf,
                        networkUnsupported: t.withdraw.networkSendUnsupported,
                        gasNotConfigured: t.withdraw.usdtGasNotConfigured,
                        insufficientUsdt: t.ux.insufficientUsdt,
                        insufficientUsdtWithFee: t.withdraw.insufficientUsdtWithFee,
                        insufficientNative: t.ux.insufficientNative,
                        insufficientAnyNetwork: t.withdraw.insufficientAnyNetwork,
                        feeEstimateFailed: t.withdraw.feeEstimateFailed,
                        recipientExternal: t.withdraw.recipientExternal,
                    },
                    t,
                });

                if ("error" in result) {
                    if (input.notifyErrors !== false) {
                        showToast(toPlainLanguageError(result.error.message, t), "error");
                    }
                    return false;
                }

                if (input.sendAsset) {
                    setAsset(input.sendAsset);
                }
                applySendPlan(result.plan);
                return true;
            } finally {
                setFeeLoading(false);
            }
        },
        [
            applySendPlan,
            asset,
            merchantId,
            nativeBalances,
            networkBalances,
            networkLocked,
            t,
        ]
    );

    useEffect(() => {
        if (isNativeSend || !balancesLoadedRef.current) return;
        const pending = pendingRepeatRef.current;
        if (!pending) return;
        pendingRepeatRef.current = null;

        setScanConfirmLoading(true);
        void runSendPlan({
            recipientInput: pending.toAddress,
            amount: pending.amount,
            preferredNetwork: pending.network,
        })
            .then((ok) => {
                if (ok) setConfirmVisible(true);
            })
            .finally(() => {
                setScanConfirmLoading(false);
            });
    }, [isNativeSend, networkBalances, runSendPlan]);

    const handleTransferLogSelect = useCallback((log: LatestTransferLog) => {
        setNetwork(log.network);
        setAddress(log.toAddress);
    }, []);

    const prepareSendConfirm = useCallback(
        async (input: {
            sendAddress: string;
            sendAmount: number;
            sendNetwork: UsdtNetwork;
            sendAsset?: ReceiveAsset;
            qrPayload?: ScannedWalletPayload["qrPayload"];
        }): Promise<boolean> =>
            runSendPlan({
                recipientInput: input.sendAddress,
                amount: input.sendAmount,
                preferredNetwork: input.sendNetwork,
                sendAsset: input.sendAsset,
                qrPayload: input.qrPayload,
            }),
        [runSendPlan]
    );

    const handleSubmit = async () => {
        const num = parseFloat(amount.replace(",", "."));
        if (!num || num <= 0) {
            showToast(t.payment.invalidAmount, "error");
            return;
        }
        const trimmed = address.trim();
        if (!trimmed) {
            showToast(t.withdraw.enterWalletAddress, "error");
            return;
        }
        const ok = await runSendPlan({
            recipientInput: trimmed,
            amount: num,
            preferredNetwork: network,
            lockNetwork: networkLocked,
        });
        if (ok) {
            setConfirmVisible(true);
        }
    };

    const handleQrScan = async (payload: ScannedWalletPayload) => {
        const trimmedAddress = payload.address.trim();
        if (!trimmedAddress) {
            showToast(t.ux.invalidWalletAddress, "error");
            return;
        }

        let resolvedNetwork = payload.network ?? network;
        const inferred = inferSendNetworkFromAddress(trimmedAddress);
        if (inferred) {
            resolvedNetwork = inferred;
        } else if (/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress) && !payload.network) {
            resolvedNetwork = pickDefaultEvmNetwork(networkBalances);
        }

        if (payload.asset) {
            setAsset(payload.asset);
        }

        if (payload.amount == null || payload.amount <= 0) {
            setAddress(trimmedAddress);
            setSendToAddress(trimmedAddress);
            if (payload.network || inferred) {
                setNetwork(resolvedNetwork);
            }
            if (payload.recipientName) {
                setRecipientPreview({ kind: "app", name: payload.recipientName });
            }
            showToast(t.withdraw.qrScanMissingAmount, "error");
            return;
        }

        setAddress(trimmedAddress);
        setSendToAddress(trimmedAddress);
        setAmount(String(payload.amount));
        setNetwork(resolvedNetwork);
        if (payload.recipientName) {
            setRecipientPreview({ kind: "app", name: payload.recipientName });
        }

        setScanConfirmLoading(true);
        try {
            const ok = await runSendPlan({
                recipientInput: trimmedAddress,
                amount: payload.amount,
                preferredNetwork: resolvedNetwork,
                sendAsset: payload.asset,
                qrPayload: payload.qrPayload,
            });
            if (ok) {
                setConfirmVisible(true);
            }
        } finally {
            setScanConfirmLoading(false);
        }
    };

    const handleConfirmSend = async (pin: string) => {
        const num = parseFloat(amount);
        const toAddress = sendToAddress.trim() || address.trim();
        if (!num || num <= 0) return;
        if (!isValidSendAddress(network, toAddress)) {
            showToast(t.ux.invalidWalletAddress, "error");
            return;
        }

        setConfirmVisible(false);
        setSending(true);
        setSendProgressVisible(true);
        setSendStep("preparing");
        try {
            await ensureAuthToken();
            if (isNativeSend) {
                await sendNative({
                    network,
                    toAddress,
                    amount: num,
                    pin,
                    onProgress: (step) => setSendStep(step)});
            } else {
                const { txHash, fromAddress } = await sendUsdt({
                    network,
                    toAddress,
                    amount: num,
                    pin,
                    onProgress: (step) => setSendStep(step)});
                void api
                    .reportWalletSend({
                        network,
                        txHash,
                        fromAddress,
                        toAddress,
                        amount: num,
                        currency: "USDT"})
                    .catch(() => {});
            }
            setSendStep("done");
            await new Promise((resolve) => setTimeout(resolve, 250));
            setAmount("");
            setAddress("");
            setSendToAddress("");
            triggerDashboardRefresh();
            void refreshLatestTransferLogs();
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
                <View style={styles.pageBody}>
                <components.Header title={screenTitle} goBack={true} />
                <View style={styles.pageScroll}>
                <components.FormScrollView
                    contentContainerStyle={{ flexGrow: 0, paddingBottom: scrollPaddingBottom }}
                >
                    <components.MerchantContent style={{ paddingVertical: 16 }}>
                        {networkLocked && !isNativeSend ? (
                            <View style={styles.networkLockedRow}>
                                <components.NetworkLogo network={network} size={22} />
                                <Text style={styles.networkLockedLabel}>
                                    {formatMessage(t.withdraw.sendingFrom, {
                                        network: getLocalizedNetworkLabel(network, t),
                                    })}
                                </Text>
                            </View>
                        ) : null}
                        <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>{t.withdraw.recipientLabel}</Text>
                            <View style={styles.addressField}>
                                <TextInput
                                    style={styles.addressInput}
                                    placeholder={t.withdraw.recipientPlaceholder}
                                    placeholderTextColor={colors.placeholder}
                                    value={address}
                                    onChangeText={(text) => {
                                        setAddress(text);
                                        setSendToAddress("");
                                        setRecipientPreview(null);
                                    }}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            <View style={styles.addressActionsRow}>
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
                                    onPress={() =>
                                        navigation.navigate("AddressBookPicker", {
                                            network,
                                        })
                                    }
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
                            {recipientPreview ? (
                                <View style={styles.recipientCard}>
                                    <Text style={styles.recipientBadge}>
                                        {recipientPreview.kind === "app"
                                            ? t.withdraw.recipientAppUser
                                            : recipientPreview.kind === "contact"
                                              ? t.withdraw.recipientContact
                                              : t.withdraw.recipientExternal}
                                    </Text>
                                    <Text style={styles.recipientTitle}>{recipientPreview.name}</Text>
                                    {recipientPreview.kind === "app" && !recipientPreview.isSelf ? (
                                        <Text style={styles.recipientHint}>
                                            {formatMessage(t.withdraw.recipientAppUserHint, {
                                                name: recipientPreview.name,
                                            })}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}
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
                                              maximumFractionDigits: 8}),
                                          symbol: currencyLabel})}`
                                    : approxUsdText}
                            </Text>
                        </View>

                        {(showPaymentMethod || needsManualPaymentMethod) && !isNativeSend && !networkLocked ? (
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
                            <Text style={styles.feeHint}>{t.withdraw.paymentMethodHint}</Text>
                        </View>
                        ) : !isNativeSend && !networkLocked ? (
                            <TouchableOpacity
                                onPress={() => setShowPaymentMethod(true)}
                                accessibilityRole="button"
                            >
                                <Text style={styles.paymentMethodLink}>{t.withdraw.changePaymentMethod}</Text>
                            </TouchableOpacity>
                        ) : null}

                        {!isNativeSend ? (
                            <LatestTransferLogsList
                                title={t.withdraw.latestTransferLogs}
                                hint={t.withdraw.latestTransferLogsHint}
                                logs={latestTransferLogs}
                                onSelect={handleTransferLogSelect}
                            />
                        ) : null}
                    </components.MerchantContent>
                </components.FormScrollView>
                </View>

                <View style={[styles.sendFooter, { paddingBottom: footerPaddingBottom }]}>
                    <components.Button
                        title={
                            scanConfirmLoading
                                ? t.withdraw.estimatingFee
                                : feeLoading
                                  ? t.withdraw.estimatingFee
                                  : t.withdraw.requestWithdrawal
                        }
                        onPress={() => void handleSubmit()}
                        loading={feeLoading || scanConfirmLoading}
                        disabled={feeLoading || sending || scanConfirmLoading}
                    />
                </View>
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
                                    setEstimatedFeeUsdt(null);
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
                onScan={(payload) => void handleQrScan(payload)}
            />
            <WithdrawConfirmModal
                visible={confirmVisible}
                amount={parseFloat(amount) || 0}
                network={network}
                networkLabel={getLocalizedNetworkLabel(network, t)}
                address={(sendToAddress.trim() || address.trim())}
                currency={currencyLabel}
                feeUsdt={isNativeSend ? null : estimatedFeeUsdt}
                feeLoading={feeLoading}
                availableBalance={
                    isNativeSend ? nativeBalances[network] : confirmAvailableBalance
                }
                submitting={sending}
                recipientName={
                    recipientPreview && !recipientPreview.isSelf ? recipientPreview.name : null
                }
                recipientKind={recipientPreview?.kind ?? null}
                recipientAvatarUrl={recipientPreview?.avatarUrl ?? null}
                onClose={() => {
                    if (!sending) setConfirmVisible(false);
                }}
                onConfirm={handleConfirmSend}
            />
            <Modal visible={scanConfirmLoading} transparent animationType="fade">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 32,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: colors.white,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: "center",
                            width: "100%",
                            maxWidth: 280,
                        }}
                    >
                        <LoadingSpinner size={40} />
                        <Text
                            style={{
                                ...FONTS.Mulish_600SemiBold,
                                fontSize: 15,
                                color: colors.mainDark,
                                marginTop: 16,
                                textAlign: "center",
                            }}
                        >
                            {t.withdraw.qrScanPreparing}
                        </Text>
                    </View>
                </View>
            </Modal>
            <SendProgressOverlay visible={sendProgressVisible} step={sendStep} />
        </View>
    );
};

export default Withdraw;
