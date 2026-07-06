import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView, 
    Platform,
    Share} from "react-native";
import LoadingSpinner from "./LoadingSpinner";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NetworkSelector from "./NetworkSelector";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { api, MerchantWallet } from "../services/api";
import { copyToClipboard } from "../utils/copyToClipboard";
import { appAlert } from '../utils/appAlert';
import { showToast } from "../utils/toast";
import { buildWalletQrPayload, splitAddressLines } from "../utils/walletQrPayload";
import { svg } from "../svg";

const USDT_LOGO = require("../assets/usdt-logo.png");

/** Bumped when receive modal layout changes (cache-bust marker). */
const RECEIVE_MODAL_VERSION = 5;

type Props = {
    visible: boolean;
    onClose: () => void;
    onSetupWallet?: () => void;
};

const ReceiveNetworkModal: React.FC<Props> = ({ visible, onClose, onSetupWallet }) => {
    const { t, locale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const [wallets, setWallets] = useState<MerchantWallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState<UsdtNetwork>("BEP20");
    const [onChainBalance, setOnChainBalance] = useState<number | null | undefined>(undefined);

    const dateLocale = locale === "es" ? "es-ES" : "en-US";

    const reset = useCallback(() => {
        setSelectedNetwork("BEP20");
        setOnChainBalance(undefined);
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [onClose, reset]);

    const loadWallets = useCallback(() => {
        setLoading(true);
        api.getWallets()
            .then((res) => setWallets(res.data.wallets))
            .catch((err) => appAlert.alert(t.common.error, err.message))
            .finally(() => setLoading(false));
    }, [t.common.error]);

    useEffect(() => {
        if (!visible) return;
        reset();
        loadWallets();
    }, [visible, loadWallets, reset]);

    const getWallet = useCallback(
        (network: UsdtNetwork) => wallets.find((w) => w.network === network),
        [wallets]
    );

    const selectedWallet = getWallet(selectedNetwork);
    const selectedAddress = selectedWallet?.address ?? "";

    useEffect(() => {
        if (!visible || loading) return;
        const configured = USDT_NETWORKS.find((network) => getWallet(network)?.address);
        if (configured) {
            setSelectedNetwork(configured);
        }
    }, [visible, loading, wallets, getWallet]);

    useEffect(() => {
        if (!visible || !selectedNetwork) return;
        let cancelled = false;
        setOnChainBalance(undefined);
        api.getWalletBalances()
            .then((res) => {
                if (cancelled) return;
                const row = res.data.balances.find((b) => b.network === selectedNetwork);
                setOnChainBalance(row?.usdtBalance ?? null);
            })
            .catch(() => {
                if (!cancelled) setOnChainBalance(null);
            });
        return () => {
            cancelled = true;
        };
    }, [visible, selectedNetwork]);

    const handleNetworkChange = useCallback(
        (network: UsdtNetwork) => {
            const wallet = getWallet(network);
            if (!wallet?.address) {
                appAlert.alert(t.wallet.networkNotSetupTitle, t.wallet.networkNotSetupMessage, [
                    { text: t.common.cancel, style: "cancel" },
                    {
                        text: t.wallet.setupWallet,
                        onPress: () => {
                            handleClose();
                            onSetupWallet?.();
                        }},
                ]);
                return;
            }
            setSelectedNetwork(network);
        },
        [getWallet, handleClose, onSetupWallet, t]
    );

    const networkLabel = getLocalizedNetworkLabel(selectedNetwork, t);
    const qrValue = useMemo(
        () =>
            selectedAddress
                ? buildWalletQrPayload(selectedNetwork, selectedAddress, null)
                : "",
        [selectedAddress, selectedNetwork]
    );
    const addressLines = useMemo(() => splitAddressLines(selectedAddress), [selectedAddress]);

    const handleCopy = useCallback(async () => {
        if (!selectedAddress) return;
        const copied = await copyToClipboard(selectedAddress);
        if (copied) {
            showToast(formatMessage(t.transaction.copiedToClipboard, { label: networkLabel }));
        } else {
            showToast(t.transaction.couldNotCopy, "error");
        }
    }, [networkLabel, selectedAddress, t]);

    const handleShare = useCallback(async () => {
        if (!selectedAddress) return;
        const message = formatMessage(t.wallet.shareMessage, {
            network: selectedNetwork,
            address: selectedAddress});
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
    }, [selectedAddress, selectedNetwork, t]);

    const balanceDisplay =
        onChainBalance === undefined
            ? "…"
            : onChainBalance == null
              ? t.wallet.balanceUnavailable
              : `${onChainBalance.toLocaleString(dateLocale, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6})} USDT`;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                sheet: {
                    flex: 1,
                    width: "100%",
                    backgroundColor: colors.bgColor,
                    paddingTop: insets.top,
                    paddingBottom: Math.max(insets.bottom, 16)},
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingTop: 8,
                    paddingBottom: 8},
                networkSelectorWrap: {
                    paddingHorizontal: 20,
                    marginBottom: 4},
                headerSide: {
                    width: 36},
                title: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    flex: 1,
                    textAlign: "center"},
                description: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    paddingHorizontal: 24,
                    marginBottom: 16,
                    lineHeight: 14 * 1.5},
                body: {
                    paddingHorizontal: 20},
                warningBox: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border},
                warningIcon: {
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#E8A317",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                    marginTop: 1},
                warningIconText: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 11,
                    color: colors.white},
                warningText: {
                    flex: 1,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 12 * 1.5},
                assetRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12},
                assetName: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 17,
                    color: colors.mainDark,
                    marginLeft: 8,
                    marginRight: 8},
                networkPill: {
                    backgroundColor: colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3},
                networkPillText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.bodyTextColor},
                balanceRow: {
                    alignItems: "center",
                    marginBottom: 14},
                balanceValue: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 20,
                    color: colors.green},
                balanceLabel: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginTop: 4},
                qrWrap: {
                    alignSelf: "center",
                    backgroundColor: colors.white,
                    padding: 10,
                    borderRadius: 14,
                    marginBottom: 14},
                addressBlock: {
                    alignItems: "center",
                    marginBottom: 18,
                    paddingHorizontal: 4},
                addressLine: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.mainDark,
                    textAlign: "center",
                    lineHeight: 18},
                actionsRow: {
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    paddingHorizontal: 8,
                    marginBottom: 8},
                actionItem: {
                    alignItems: "center",
                    minWidth: 72},
                actionCircle: {
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6},
                actionLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.mainDark,
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
                    lineHeight: 20}}),
        [FONTS, colors, insets.top, insets.bottom, RECEIVE_MODAL_VERSION]
    );

    const renderReceiveContent = () => (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {loading ? (
                <LoadingSpinner size={40} style={{ marginVertical: 24 }} />
            ) : (
                <>
                    <View style={styles.warningBox}>
                        <View style={styles.warningIcon}>
                            <Text style={styles.warningIconText}>i</Text>
                        </View>
                        <Text style={styles.warningText}>
                            {formatMessage(t.wallet.receiveWarning, { network: selectedNetwork })}
                        </Text>
                    </View>

                    <View style={styles.assetRow}>
                        <svg.UsdtMarkSvg size={28} />
                        <Text style={styles.assetName}>USDT</Text>
                        <View style={styles.networkPill}>
                            <Text style={styles.networkPillText}>{selectedNetwork}</Text>
                        </View>
                    </View>

                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{balanceDisplay}</Text>
                        <Text style={styles.balanceLabel}>{t.wallet.onChainBalance}</Text>
                    </View>

                    {qrValue ? (
                        <View style={styles.qrWrap}>
                            <QRCode
                                value={qrValue}
                                size={148}
                                logo={USDT_LOGO}
                                logoSize={30}
                                logoBackgroundColor={colors.white}
                                logoMargin={3}
                                quietZone={6}
                            />
                        </View>
                    ) : null}

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
                                <svg.CopySvg color={colors.mainDark} size={20} />
                            </View>
                            <Text style={styles.actionLabel}>{t.wallet.copyLabel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                            <View style={styles.actionCircle}>
                                <svg.ShareSvg color={colors.mainDark} size={20} />
                            </View>
                            <Text style={styles.actionLabel}>{t.wallet.share}</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </ScrollView>
    );

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={styles.sheet}>
                <View style={styles.header}>
                    <View style={styles.headerSide} />
                    <Text style={styles.title}>{t.wallet.receiveTitle}</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        accessibilityRole="button"
                        accessibilityLabel={t.common.cancel}
                    >
                        <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.networkSelectorWrap}>
                    <NetworkSelector value={selectedNetwork} onChange={handleNetworkChange} />
                </View>
                {renderReceiveContent()}
            </View>
        </Modal>
    );
};

export default ReceiveNetworkModal;
