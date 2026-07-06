import {
    View,
    Text,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    ScrollView} from "react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "./Button";
import InputField, { InputFieldHandle } from "./InputField";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { splitAddressLines } from "../utils/walletQrPayload";
import { appAlert } from '../utils/appAlert';

type Props = {
    visible: boolean;
    amount: number;
    network: UsdtNetwork;
    address: string;
    currency?: string;
    submitting?: boolean;
    onClose: () => void;
    onConfirm: (pin: string) => void;
};

const WithdrawConfirmModal: React.FC<Props> = ({
    visible,
    amount,
    network,
    address,
    currency = "USDT",
    submitting = false,
    onClose,
    onConfirm}) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const pinInputRef = useRef<InputFieldHandle | null>(null);
    const [pin, setPin] = useState("");

    useEffect(() => {
        if (!visible) {
            setPin("");
        }
    }, [visible]);

    const networkLabel = getLocalizedNetworkLabel(network, t);
    const amountLabel = amount.toLocaleString(dateLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6});
    const addressLines = useMemo(() => splitAddressLines(address), [address]);

    const handleConfirm = () => {
        if (submitting) return;
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
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end"},
                sheet: {
                    backgroundColor: colors.bgColor,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: "88%",
                    paddingBottom: Math.max(insets.bottom, 16)},
                handle: {
                    alignSelf: "center",
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    marginTop: 10,
                    marginBottom: 8},
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingBottom: 8},
                title: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    flex: 1,
                    textAlign: "center"},
                closeButton: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surfaceMuted},
                closeButtonText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 18,
                    color: colors.bodyTextColor,
                    lineHeight: 20},
                body: {
                    paddingHorizontal: 20},
                description: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 14 * 1.6,
                    marginBottom: 16,
                    textAlign: "center"},
                summaryCard: {
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border},
                fieldBlock: {
                    marginBottom: 12},
                fieldLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: colors.bodyTextColor,
                    marginBottom: 4},
                fieldValue: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    lineHeight: 20,
                    paddingLeft: 14},
                addressLine: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    lineHeight: 20,
                    letterSpacing: 0.2,
                    paddingLeft: 14},
                feeNote: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                    marginBottom: 16},
                pinLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 8},
                actions: {
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 20},
                actionBtn: {
                    flex: 1},
                cancelButton: {
                    flex: 1,
                    height: 50,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center"},
                cancelLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark}}),
        [FONTS, colors, insets.bottom]
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={submitting ? undefined : onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <View style={{ width: 36 }} />
                        <Text style={styles.title}>{t.withdraw.withdrawalRequest}</Text>
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

                    <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
                        <Text style={styles.description}>{t.withdraw.description}</Text>

                        <View style={styles.summaryCard}>
                            <View style={styles.fieldBlock}>
                                <Text style={styles.fieldLabel}>{t.withdraw.confirmAmount}</Text>
                                <Text style={styles.fieldValue}>{amountLabel} {currency}</Text>
                            </View>
                            <View style={styles.fieldBlock}>
                                <Text style={styles.fieldLabel}>{t.network.networkLabel}</Text>
                                <Text style={styles.fieldValue}>
                                    {networkLabel}
                                </Text>
                            </View>
                            <View style={[styles.fieldBlock, { marginBottom: 0 }]}>
                                <Text style={styles.fieldLabel}>{t.withdraw.confirmTo}</Text>
                                {addressLines.map((line, index) => (
                                    <Text key={index} style={styles.addressLine} selectable>
                                        {line}
                                    </Text>
                                ))}
                            </View>
                        </View>

                        <Text style={styles.feeNote}>{t.ux.networkFeeExplainer}</Text>

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
                            containerStyle={{ marginBottom: 20 }}
                        />
                    </ScrollView>

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
                            disabled={submitting}
                            containerStyle={styles.actionBtn}
                        />
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default WithdrawConfirmModal;
