import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Share,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import React, { useMemo, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";

import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { UsdtNetwork, ReceiveAsset } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { api, type MerchantWallet } from "../services/api";
import { copyToClipboard } from "../utils/copyToClipboard";
import { showToast } from "../utils/toast";
import {
    buildWalletQrPayload,
    getReceiveAssetSymbol,
    splitAddressLines,
} from "../utils/walletQrPayload";
import { svg } from "../svg";

type RouteParams = {
    network: UsdtNetwork;
    address: string;
    asset?: ReceiveAsset;
};

const USDT_LOGO = require("../assets/usdt-logo.png");

const WalletReceive: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const routeParams = route.params as RouteParams;
    const [selectedNetwork, setSelectedNetwork] = useState<UsdtNetwork>(routeParams.network);
    const [selectedAsset, setSelectedAsset] = useState<ReceiveAsset>(routeParams.asset ?? "USDT");
    const [wallets, setWallets] = useState<MerchantWallet[]>([]);
    const [amount, setAmount] = useState<string>("");
    const [amountModalVisible, setAmountModalVisible] = useState(false);
    const [draftAmount, setDraftAmount] = useState("");

    const address = useMemo(() => {
        const wallet = wallets.find((w) => w.network === selectedNetwork);
        if (wallet?.address) return wallet.address;
        if (selectedNetwork === routeParams.network) return routeParams.address;
        return "";
    }, [wallets, selectedNetwork, routeParams.address, routeParams.network]);

    const parsedAmount = useMemo(() => {
        const n = parseFloat(amount);
        return Number.isFinite(n) && n > 0 ? n : null;
    }, [amount]);

    const assetSymbol = getReceiveAssetSymbol(selectedNetwork, selectedAsset);
    const isUsdt = selectedAsset === "USDT";

    const qrValue = useMemo(
        () =>
            address
                ? buildWalletQrPayload(selectedNetwork, address, parsedAmount, selectedAsset)
                : "",
        [selectedNetwork, address, parsedAmount, selectedAsset]
    );

    const addressLines = useMemo(() => splitAddressLines(address), [address]);
    const networkLabel = getLocalizedNetworkLabel(selectedNetwork, t);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                warningBox: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                warningIcon: {
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#E8A317",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    marginTop: 1,
                },
                warningIconText: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 12,
                    color: colors.white,
                },
                warningText: {
                    flex: 1,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 13 * 1.5,
                },
                assetRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                },
                assetName: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 18,
                    color: colors.mainDark,
                    marginLeft: 10,
                    marginRight: 8,
                },
                networkPill: {
                    backgroundColor: colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                },
                networkPillText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                },
                qrWrap: {
                    alignSelf: "center",
                    backgroundColor: colors.white,
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 16,
                },
                addressBlock: {
                    alignItems: "center",
                    marginBottom: 28,
                    paddingHorizontal: 8,
                },
                addressLine: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    textAlign: "center",
                    lineHeight: 20,
                    letterSpacing: 0.2,
                },
                amountHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.linkColor,
                    textAlign: "center",
                    marginBottom: 8,
                },
                actionsRow: {
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    paddingHorizontal: 12,
                },
                actionItem: {
                    alignItems: "center",
                    minWidth: 80,
                },
                actionCircle: {
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                },
                actionLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.mainDark,
                    textAlign: "center",
                },
                modalBackdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    justifyContent: "center",
                    padding: 24,
                },
                modalCard: {
                    backgroundColor: colors.bgColor,
                    borderRadius: 16,
                    padding: 20,
                },
                modalTitle: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    marginBottom: 8,
                    textAlign: "center",
                },
                modalDesc: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 16,
                    lineHeight: 14 * 1.5,
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
                    marginBottom: 16,
                },
                modalActions: {
                    flexDirection: "row",
                    gap: 10,
                },
                modalBtn: {
                    flex: 1,
                },
            }),
        [colors, FONTS]
    );

    const handleCopy = useCallback(async () => {
        const copied = await copyToClipboard(address);
        if (copied) {
            showToast(
                formatMessage(t.transaction.copiedToClipboard, { label: assetSymbol })
            );
        } else {
            showToast(t.transaction.couldNotCopy, "error");
        }
    }, [address, assetSymbol, t]);

    const handleShare = useCallback(async () => {
        const message = isUsdt
            ? formatMessage(t.wallet.shareMessage, { network: selectedNetwork, address })
            : formatMessage(t.wallet.shareMessageNative, {
                  symbol: assetSymbol,
                  network: selectedNetwork,
                  address,
              });
        try {
            if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: t.wallet.receiveTitle, text: message });
                return;
            }
            await Share.share({ message, title: t.wallet.receiveTitle });
        } catch {
            const copied = await copyToClipboard(message);
            if (copied) {
                showToast(t.wallet.shareCopiedFallback);
            } else {
                showToast(t.wallet.shareFailed, "error");
            }
        }
    }, [address, assetSymbol, isUsdt, selectedNetwork, t]);

    const openAmountModal = () => {
        setDraftAmount(amount);
        setAmountModalVisible(true);
    };

    const applyAmount = () => {
        const n = parseFloat(draftAmount.replace(",", "."));
        if (draftAmount.trim() === "" || !Number.isFinite(n) || n <= 0) {
            setAmount("");
        } else {
            setAmount(String(n));
        }
        setAmountModalVisible(false);
    };

    useFocusEffect(
        useCallback(() => {
            if (routeParams.network) {
                setSelectedNetwork(routeParams.network);
            }
            if (routeParams.asset) {
                setSelectedAsset(routeParams.asset);
            }
        }, [routeParams.asset, routeParams.network])
    );

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            api.getWallets()
                .then((res) => {
                    if (!cancelled) setWallets(res.data.wallets);
                })
                .catch(() => {
                    if (!cancelled) setWallets([]);
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header title={t.wallet.receiveTitle} goBack={true} />

                <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                    <components.MerchantContent style={{ paddingTop: 8 }}>
                        <View style={styles.warningBox}>
                            <View style={styles.warningIcon}>
                                <Text style={styles.warningIconText}>i</Text>
                            </View>
                            <Text style={styles.warningText}>
                                {isUsdt
                                    ? formatMessage(t.wallet.receiveWarning, {
                                          network: selectedNetwork,
                                      })
                                    : formatMessage(t.wallet.receiveNativeWarning, {
                                          symbol: assetSymbol,
                                          network: networkLabel,
                                      })}
                            </Text>
                        </View>

                        <View style={styles.assetRow}>
                            {isUsdt ? (
                                <svg.UsdtMarkSvg size={32} />
                            ) : (
                                <components.NetworkLogo network={selectedNetwork} size={32} />
                            )}
                            <Text style={styles.assetName}>{assetSymbol}</Text>
                            <View style={styles.networkPill}>
                                <Text style={styles.networkPillText}>{selectedNetwork}</Text>
                            </View>
                        </View>

                        <View style={styles.qrWrap}>
                            {address && qrValue ? (
                                <QRCode
                                    value={qrValue}
                                    size={220}
                                    logo={isUsdt ? USDT_LOGO : undefined}
                                    logoSize={isUsdt ? 44 : undefined}
                                    logoBackgroundColor={colors.white}
                                    logoMargin={4}
                                    quietZone={8}
                                />
                            ) : (
                                <Text style={styles.warningText}>{t.wallet.addressUnavailable}</Text>
                            )}
                        </View>

                        {parsedAmount != null && (
                            <Text style={styles.amountHint}>
                                {parsedAmount} {assetSymbol}
                            </Text>
                        )}

                        <View style={styles.addressBlock}>
                            {addressLines.map((line, i) => (
                                <Text key={i} style={styles.addressLine} selectable>
                                    {line}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.actionItem} onPress={handleCopy}>
                                <View style={styles.actionCircle}>
                                    <svg.CopySvg color={colors.mainDark} size={22} />
                                </View>
                                <Text style={styles.actionLabel}>{t.wallet.copyLabel}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionItem} onPress={openAmountModal}>
                                <View style={styles.actionCircle}>
                                    <svg.SetAmountSvg color={colors.mainDark} size={22} />
                                </View>
                                <Text style={styles.actionLabel}>{t.wallet.setAmount}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                                <View style={styles.actionCircle}>
                                    <svg.ShareSvg color={colors.mainDark} size={22} />
                                </View>
                                <Text style={styles.actionLabel}>{t.wallet.share}</Text>
                            </TouchableOpacity>
                        </View>
                    </components.MerchantContent>
                </ScrollView>
            </SafeAreaView>

            <Modal visible={amountModalVisible} transparent animationType="fade">
                <KeyboardAvoidingView
                    style={styles.modalBackdrop}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t.wallet.setAmountTitle}</Text>
                        <Text style={styles.modalDesc}>
                            {isUsdt
                                ? t.wallet.setAmountDescription
                                : t.wallet.setAmountDescriptionNative}
                        </Text>
                        <TextInput
                            style={styles.amountInput}
                            value={draftAmount}
                            onChangeText={setDraftAmount}
                            placeholder={t.wallet.amountPlaceholder}
                            placeholderTextColor={colors.bodyTextColor}
                            keyboardType="decimal-pad"
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <components.Button
                                title={t.wallet.clearAmount}
                                onPress={() => {
                                    setDraftAmount("");
                                    setAmount("");
                                    setAmountModalVisible(false);
                                }}
                                containerStyle={styles.modalBtn}
                            />
                            <components.Button
                                title={t.common.ok}
                                onPress={applyAmount}
                                containerStyle={styles.modalBtn}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default WalletReceive;
