import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Platform,
    TextInput,
    } from "react-native";
import LoadingSpinner from "./LoadingSpinner";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "./Button";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { parseScannedWalletAddress } from "../utils/parseScannedWalletAddress";

type Props = {
    visible: boolean;
    onClose: () => void;
    onScan: (address: string) => void;
};

const QrScanModal: React.FC<Props> = ({ visible, onClose, onScan }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [pasteValue, setPasteValue] = useState("");
    const scannedRef = useRef(false);

    useEffect(() => {
        if (!visible) {
            scannedRef.current = false;
            setPasteValue("");
            return;
        }
        if (!permission?.granted) {
            void requestPermission();
        }
    }, [visible, permission?.granted, requestPermission]);

    const applyAddress = useCallback(
        (raw: string) => {
            const parsed = parseScannedWalletAddress(raw);
            if (!parsed) return;
            onScan(parsed);
            onClose();
        },
        [onClose, onScan]
    );

    const handleBarcode = useCallback(
        ({ data }: { data: string }) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            applyAddress(data);
        },
        [applyAddress]
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.92)",
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingTop: Math.max(insets.top, 12),
                    paddingBottom: 12,
                },
                title: {
                    ...FONTS.H4,
                    color: colors.pureWhite,
                    flex: 1,
                    textAlign: "center",
                },
                closeButton: {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.12)",
                },
                closeButtonText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 18,
                    color: colors.pureWhite,
                    lineHeight: 20,
                },
                cameraWrap: {
                    flex: 1,
                    marginHorizontal: 20,
                    marginBottom: 16,
                    borderRadius: 16,
                    overflow: "hidden",
                    minHeight: 280,
                },
                camera: {
                    flex: 1,
                },
                hint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.75)",
                    textAlign: "center",
                    paddingHorizontal: 24,
                    marginBottom: 16,
                    lineHeight: 13 * 1.5,
                },
                pasteCard: {
                    marginHorizontal: 20,
                    marginBottom: Math.max(insets.bottom, 16),
                    backgroundColor: colors.bgColor,
                    borderRadius: 14,
                    padding: 16,
                },
                pasteTitle: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    marginBottom: 8,
                },
                pasteInput: {
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.mainDark,
                    marginBottom: 12,
                    minHeight: 44,
                },
                permissionBox: {
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                },
                permissionText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.85)",
                    textAlign: "center",
                    marginBottom: 16,
                    lineHeight: 14 * 1.5,
                },
            }),
        [FONTS, colors, insets.bottom, insets.top]
    );

    const canUseCamera = permission?.granted;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.header}>
                    <View style={{ width: 36 }} />
                    <Text style={styles.title}>{t.withdraw.scanQr}</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel={t.common.cancel}
                    >
                        <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                </View>

                {canUseCamera ? (
                    <>
                        <Text style={styles.hint}>{t.withdraw.scanQrHint}</Text>
                        <View style={styles.cameraWrap}>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                                onBarcodeScanned={handleBarcode}
                            />
                        </View>
                    </>
                ) : (
                    <View style={styles.permissionBox}>
                        {Platform.OS !== "web" && permission == null ? (
                            <LoadingSpinner size={36} />
                        ) : (
                            <>
                                <Text style={styles.permissionText}>
                                    {Platform.OS === "web"
                                        ? t.withdraw.scanQrWebHint
                                        : t.withdraw.scanQrPermissionDenied}
                                </Text>
                                {Platform.OS !== "web" && !permission?.granted ? (
                                    <Button
                                        title={t.withdraw.scanQrEnableCamera}
                                        onPress={() => void requestPermission()}
                                    />
                                ) : null}
                            </>
                        )}
                    </View>
                )}

                <View style={styles.pasteCard}>
                    <Text style={styles.pasteTitle}>{t.withdraw.scanQrPasteLabel}</Text>
                    <TextInput
                        style={styles.pasteInput}
                        value={pasteValue}
                        onChangeText={setPasteValue}
                        placeholder={t.withdraw.scanQrPastePlaceholder}
                        placeholderTextColor={colors.bodyTextColor}
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                    />
                    <Button
                        title={t.withdraw.scanQrUseAddress}
                        onPress={() => applyAddress(pasteValue)}
                        disabled={!pasteValue.trim()}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default QrScanModal;
