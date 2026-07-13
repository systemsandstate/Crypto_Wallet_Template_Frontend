import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "./Button";
import InputField, { InputFieldHandle } from "./InputField";
import LoadingSpinner from "./LoadingSpinner";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { splitAddressLines } from "../utils/walletQrPayload";
import { appAlert } from "../utils/appAlert";
import { formatUsdtAmount } from "../utils/formatAmount";
import { svg } from "../svg";

type Props = {
    visible: boolean;
    amount: number;
    network: UsdtNetwork;
    networkLabel?: string;
    address: string;
    currency?: string;
    feeUsdt?: number | null;
    feeLoading?: boolean;
    availableBalance?: number | null;
    submitting?: boolean;
    recipientName?: string | null;
    recipientKind?: "app" | "contact" | "external" | null;
    recipientAvatarUrl?: string | null;
    onClose: () => void;
    onConfirm: (pin: string) => void;
};

const WithdrawConfirmModal: React.FC<Props> = ({
    visible,
    amount,
    address,
    currency = "USDT",
    feeUsdt = null,
    feeLoading = false,
    availableBalance = null,
    submitting = false,
    recipientName = null,
    recipientKind = null,
    recipientAvatarUrl = null,
    onClose,
    onConfirm,
}) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const pinInputRef = useRef<InputFieldHandle | null>(null);
    const [pin, setPin] = useState("");

    useEffect(() => {
        if (!visible) {
            setPin("");
        }
    }, [visible]);

    const amountLabel = formatUsdtAmount(amount, dateLocale);
    const addressLines = useMemo(() => splitAddressLines(address), [address]);
    const totalDebit = amount + (feeUsdt ?? 0);
    const totalLabel = formatUsdtAmount(totalDebit, dateLocale);
    const balanceLabel =
        availableBalance != null ? formatUsdtAmount(availableBalance, dateLocale) : null;

    const recipientSubtitle = useMemo(() => {
        if (!recipientName) return null;
        if (recipientKind === "app") return t.withdraw.recipientAppUser;
        if (recipientKind === "contact") return t.withdraw.recipientContact;
        return t.withdraw.recipientExternal;
    }, [recipientKind, recipientName, t]);

    const showAddressBlock = !recipientName || recipientKind === "external";
    const avatarSize = 64;
    const isUsdtTransfer = currency === "USDT";
    const showSummaryCard =
        feeLoading ||
        feeUsdt != null ||
        balanceLabel != null ||
        showAddressBlock ||
        isUsdtTransfer;
    const feeValueLabel =
        feeLoading
            ? t.withdraw.estimatingFee
            : feeUsdt != null
              ? `${formatUsdtAmount(feeUsdt, dateLocale)} USDT`
              : t.ux.networkFeeVaries;

    const handleConfirm = () => {
        if (submitting || feeLoading) return;
        const pinValue = (pinInputRef.current?.getValue?.() ?? pin).trim();
        if (pinValue.length < 4) {
            appAlert.alert(t.common.error, t.withdraw.walletPinRequired);
            return;
        }
        onConfirm(pinValue);
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                screen: {
                    flex: 1,
                    backgroundColor: colors.bgColor,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingTop: 4,
                    paddingBottom: 8,
                },
                title: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    flex: 1,
                    textAlign: "center",
                },
                closeButton: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surfaceMuted,
                },
                closeButtonText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 18,
                    color: colors.bodyTextColor,
                    lineHeight: 20,
                },
                body: {
                    flex: 1,
                    paddingHorizontal: 24,
                },
                recipientBlock: {
                    alignItems: "center",
                    marginBottom: 16,
                },
                avatar: {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    overflow: "hidden",
                },
                avatarImage: {
                    width: avatarSize,
                    height: avatarSize,
                },
                recipientName: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 20,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 4,
                },
                recipientSubtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                },
                amountHero: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 32,
                    color: colors.mainDark,
                    textAlign: "center",
                    marginBottom: 16,
                },
                summaryCard: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                fieldRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                },
                fieldRowLast: {
                    marginBottom: 0,
                },
                fieldLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: colors.bodyTextColor,
                },
                fieldValueRight: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    textAlign: "right",
                },
                addressBlock: {
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                },
                addressLine: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    lineHeight: 20,
                    letterSpacing: 0.2,
                    textAlign: "right",
                },
                flexSpacer: {
                    flex: 1,
                    minHeight: 20,
                },
                bottomBlock: {
                    paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 12 : 16) + 12,
                },
                feeNote: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                    textAlign: "center",
                    marginBottom: 28,
                    paddingHorizontal: 4,
                },
                pinLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 10,
                },
                actions: {
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 20,
                },
                actionBtn: {
                    flex: 1,
                },
                cancelButton: {
                    flex: 1,
                    height: 52,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                },
                cancelLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark,
                },
            }),
        [FONTS, avatarSize, colors, insets.bottom]
    );

    const detailRow = (label: string, value: string, accent?: string, isLast = false) => (
        <View style={[styles.fieldRow, isLast ? styles.fieldRowLast : null]} key={label}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={[styles.fieldValueRight, accent ? { color: accent } : null]}>{value}</Text>
        </View>
    );

    const avatarBackground =
        recipientKind === "app"
            ? colors.accentBlue
            : recipientKind === "contact"
              ? isDark
                  ? "rgba(255,255,255,0.12)"
                  : colors.surfaceMuted
              : isDark
                ? "rgba(255,255,255,0.08)"
                : colors.surfaceMuted;
    const avatarForeground =
        recipientKind === "app" ? colors.pureWhite : isDark ? colors.headerMuted : colors.bodyTextColor;
    const displayName = recipientName?.trim() || t.withdraw.recipientExternal;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.header}>
                        <View style={{ width: 36 }} />
                        <Text style={styles.title}>{t.withdraw.confirmTitle}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            disabled={submitting}
                            accessibilityRole="button"
                            accessibilityLabel={t.common.cancel}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.recipientBlock}>
                            <View style={[styles.avatar, { backgroundColor: avatarBackground }]}>
                                {recipientAvatarUrl ? (
                                    <Image
                                        source={{ uri: recipientAvatarUrl }}
                                        style={styles.avatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <svg.UserOneSvg
                                        color={avatarForeground}
                                        size={Math.round(avatarSize * 0.46)}
                                    />
                                )}
                            </View>
                            <Text style={styles.recipientName}>{displayName}</Text>
                            {recipientSubtitle ? (
                                <Text style={styles.recipientSubtitle}>{recipientSubtitle}</Text>
                            ) : null}
                        </View>

                        <Text style={styles.amountHero}>
                            {amountLabel} {currency}
                        </Text>

                        {showSummaryCard ? (
                            <View style={styles.summaryCard}>
                                {isUsdtTransfer ? (
                                    feeLoading ? (
                                        <View style={[styles.fieldRow, { justifyContent: "center", gap: 10 }]}>
                                            <LoadingSpinner size={20} />
                                            <Text style={styles.fieldValueRight}>{t.withdraw.estimatingFee}</Text>
                                        </View>
                                    ) : (
                                        <>
                                            {detailRow(t.withdraw.networkFeeUsdt, feeValueLabel)}
                                            {feeUsdt != null
                                                ? detailRow(
                                                      t.withdraw.confirmTotalDebit,
                                                      `${totalLabel} USDT`,
                                                      colors.linkColor
                                                  )
                                                : null}
                                        </>
                                    )
                                ) : feeLoading ? (
                                    <View style={[styles.fieldRow, { justifyContent: "center", gap: 10 }]}>
                                        <LoadingSpinner size={20} />
                                        <Text style={styles.fieldValueRight}>{t.withdraw.estimatingFee}</Text>
                                    </View>
                                ) : feeUsdt != null ? (
                                    <>
                                        {detailRow(
                                            t.withdraw.networkFeeUsdt,
                                            `${formatUsdtAmount(feeUsdt, dateLocale)} USDT`
                                        )}
                                        {detailRow(
                                            t.withdraw.confirmTotalDebit,
                                            `${totalLabel} USDT`,
                                            colors.linkColor
                                        )}
                                    </>
                                ) : null}

                                {balanceLabel
                                    ? detailRow(
                                          t.withdraw.confirmAvailableBalance,
                                          `${balanceLabel} ${currency}`,
                                          undefined,
                                          !showAddressBlock && !isUsdtTransfer && feeUsdt == null && !feeLoading
                                      )
                                    : null}

                                {showAddressBlock ? (
                                    <View style={styles.addressBlock}>
                                        <View style={[styles.fieldRow, styles.fieldRowLast]}>
                                            <Text style={styles.fieldLabel}>{t.withdraw.confirmTo}</Text>
                                            <View style={{ flex: 1, marginLeft: 16 }}>
                                                {addressLines.map((line, index) => (
                                                    <Text key={index} style={styles.addressLine} selectable>
                                                        {line}
                                                    </Text>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ) : null}

                        <View style={styles.flexSpacer} />

                        <View style={styles.bottomBlock}>
                            <Text style={styles.feeNote}>
                                {feeUsdt != null ? t.withdraw.usdtFeeExplainer : t.ux.networkFeeExplainer}
                            </Text>

                            <Text style={styles.pinLabel}>{t.withdraw.walletPinLabel}</Text>
                            <InputField
                                placeholder={t.withdraw.walletPinPlaceholder}
                                value={pin}
                                onChangeText={setPin}
                                inputRef={pinInputRef}
                                secureTextEntry
                                keyboardType="numeric"
                                authRole="password"
                                syncImmediately
                                singleLine
                                containerStyle={{ marginBottom: 0 }}
                            />

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}
                                    disabled={submitting}
                                    accessibilityRole="button"
                                    accessibilityLabel={t.common.cancel}
                                >
                                    <Text style={styles.cancelLabel}>{t.common.cancel}</Text>
                                </TouchableOpacity>
                                <Button
                                    title={submitting ? t.withdraw.sending : t.withdraw.confirmSend}
                                    onPress={handleConfirm}
                                    loading={submitting}
                                    disabled={submitting || feeLoading}
                                    containerStyle={styles.actionBtn}
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

export default WithdrawConfirmModal;
