import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    Pressable,
    InteractionManager,
} from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LoadingSpinner from "./LoadingSpinner";
import Button from "./Button";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { useAppSelector } from "../hooks/useAppSelector";
import { isRecipientEmail } from "../utils/isRecipientEmail";
import { buildSendPlan } from "../utils/buildSendPlan";
import type { SendPlan } from "../utils/buildSendPlan";
import { prepareWalletContext } from "../services/wallet/syncDeviceWallet";
import { api } from "../services/api";
import {
    resolveNetworkBalanceMap,
    resolveNetworkNativeBalanceMap,
} from "../utils/walletBalance";
import { pickFundedNetworkLabel } from "../utils/pickFundedSendNetwork";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { showToast } from "../utils/toast";

type Props = {
    visible: boolean;
    onClose: () => void;
    onReadyToConfirm: (input: { network: UsdtNetwork; plan: SendPlan }) => void;
};

const PayByEmailModal: React.FC<Props> = ({ visible, onClose, onReadyToConfirm }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const merchantId = useAppSelector((state) => state.auth.merchant?.id);
    const [email, setEmail] = useState("");
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reset = useCallback(() => {
        setEmail("");
        setAmount("");
        setSubmitting(false);
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [onClose, reset]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    justifyContent: "flex-end",
                },
                sheet: {
                    backgroundColor: colors.bgColor,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingHorizontal: 20,
                    paddingTop: 12,
                },
                handle: {
                    alignSelf: "center",
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    marginBottom: 16,
                },
                title: {
                    ...FONTS.H3,
                    color: colors.mainDark,
                    marginBottom: 6,
                },
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 20,
                    marginBottom: 20,
                },
                label: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    marginBottom: 8,
                },
                input: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: colors.mainDark,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 16,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
                amountField: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    marginBottom: 16,
                },
                amountPrefix: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark,
                    marginRight: 4,
                },
                amountInput: {
                    flex: 1,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: colors.mainDark,
                    paddingVertical: 12,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
            }),
        [FONTS, colors]
    );

    const handleContinue = async () => {
        const trimmedEmail = email.trim();
        const num = parseFloat(amount.replace(",", "."));

        if (!isRecipientEmail(trimmedEmail)) {
            showToast(t.payByEmail.invalidEmail, "error");
            return;
        }
        if (!num || num <= 0) {
            showToast(t.payment.invalidAmount, "error");
            return;
        }

        setSubmitting(true);
        try {
            const [activeAddresses, cached] = await Promise.all([
                prepareWalletContext(),
                api.getWalletBalances({ live: true }),
            ]);
            const networkBalances = resolveNetworkBalanceMap(
                cached.data.balances ?? [],
                activeAddresses
            );
            const nativeBalances = resolveNetworkNativeBalanceMap(
                cached.data.balances ?? [],
                activeAddresses
            );
            const preferredNetwork =
                pickFundedNetworkLabel(networkBalances, [...USDT_NETWORKS], num, 0) ?? "BEP20";

            const result = await buildSendPlan({
                recipientInput: trimmedEmail,
                amount: num,
                preferredNetwork,
                asset: "USDT",
                merchantId,
                networkBalances,
                nativeBalances,
                labels: {
                    invalidAmount: t.payment.invalidAmount,
                    missingRecipient: t.payByEmail.invalidEmail,
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
                showToast(result.error.message, "error");
                return;
            }

            const payload = { network: result.plan.network, plan: result.plan };
            reset();
            onClose();
            InteractionManager.runAfterInteractions(() => {
                onReadyToConfirm(payload);
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t.payByEmail.failed;
            showToast(message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={styles.overlay} onPress={handleClose}>
                    <Pressable
                        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
                        onPress={(event) => event.stopPropagation()}
                    >
                        <View style={styles.handle} />
                        <Text style={styles.title}>{t.payByEmail.title}</Text>
                        <Text style={styles.subtitle}>{t.payByEmail.subtitle}</Text>

                        <Text style={styles.label}>{t.payByEmail.emailLabel}</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder={t.payByEmail.emailPlaceholder}
                            placeholderTextColor={colors.placeholder}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            returnKeyType="next"
                            editable={!submitting}
                        />

                        <Text style={styles.label}>{t.withdraw.amountLabel}</Text>
                        <View style={styles.amountField}>
                            <Text style={styles.amountPrefix}>$</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0.00"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                onSubmitEditing={() => void handleContinue()}
                                editable={!submitting}
                            />
                        </View>

                        <View style={{ marginTop: 24 }}>
                            {submitting ? (
                                <View style={{ alignItems: "center", paddingVertical: 14 }}>
                                    <LoadingSpinner size={32} />
                                    <Text
                                        style={{
                                            marginTop: 10,
                                            color: colors.bodyTextColor,
                                            ...FONTS.Mulish_400Regular,
                                        }}
                                    >
                                        {t.withdraw.qrScanPreparing}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Button
                                        title={t.payByEmail.continue}
                                        onPress={(event) => {
                                            if (Platform.OS === "web") {
                                                event?.preventDefault?.();
                                            }
                                            void handleContinue();
                                        }}
                                    />
                                    <TouchableOpacity
                                        onPress={handleClose}
                                        style={{ marginTop: 12, alignItems: "center" }}
                                        accessibilityRole="button"
                                    >
                                        <Text
                                            style={{
                                                ...FONTS.Mulish_600SemiBold,
                                                color: colors.bodyTextColor,
                                            }}
                                        >
                                            {t.common.cancel}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default PayByEmailModal;
