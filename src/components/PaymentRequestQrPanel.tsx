import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { api, PaymentRequest } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { useAppSelector } from "../hooks/useAppSelector";
import { RootState } from "../store/store";
import {
    DEFAULT_USDT_NETWORK,
    USDT_NETWORKS,
    UsdtNetwork,
} from "../constants/usdtNetworks";
import { buildReceiveQrPayload, splitAddressLines } from "../utils/walletQrPayload";
import { copyToClipboard } from "../utils/copyToClipboard";
import { showToast } from "../utils/toast";
import { svg } from "../svg";

const USDT_LOGO = require("../assets/usdt-logo.png");
const QR_COMPACT = 156;
const QR_ENLARGE_MAX = 300;

type Props = {
    payment: PaymentRequest;
};

const PaymentRequestQrPanel: React.FC<Props> = ({ payment }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const merchantName = useAppSelector((state: RootState) => state.auth.merchant?.businessName);
    const [wallets, setWallets] = useState<Array<{ network: UsdtNetwork; address: string }>>([]);
    const [selectedNetwork, setSelectedNetwork] = useState<UsdtNetwork>(DEFAULT_USDT_NETWORK);
    const [enlarged, setEnlarged] = useState(false);

    const amount = parseFloat(payment.amount) || 0;

    useEffect(() => {
        let cancelled = false;
        void api.getWallets().then((res) => {
            if (cancelled) return;
            const rows = (res.data.wallets ?? [])
                .filter((w) => USDT_NETWORKS.includes(w.network as UsdtNetwork))
                .map((w) => ({
                    network: w.network as UsdtNetwork,
                    address: w.address.trim(),
                }))
                .filter((w) => w.address.length > 0);
            setWallets(rows);
        }).catch(() => {
            if (!cancelled) setWallets([]);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const preferred = USDT_NETWORKS.includes(payment.network as UsdtNetwork)
            ? (payment.network as UsdtNetwork)
            : DEFAULT_USDT_NETWORK;
        setSelectedNetwork(preferred);
    }, [payment.network]);

    const addressByNetwork = useMemo(() => {
        const map = new Map<UsdtNetwork, string>();
        for (const row of wallets) {
            map.set(row.network, row.address);
        }
        if (payment.depositAddress?.trim()) {
            const net = USDT_NETWORKS.includes(payment.network as UsdtNetwork)
                ? (payment.network as UsdtNetwork)
                : DEFAULT_USDT_NETWORK;
            if (!map.has(net)) map.set(net, payment.depositAddress.trim());
        }
        return map;
    }, [payment.depositAddress, payment.network, wallets]);

    const availableNetworks = useMemo(
        () => USDT_NETWORKS.filter((network) => Boolean(addressByNetwork.get(network))),
        [addressByNetwork]
    );

    useEffect(() => {
        if (availableNetworks.length && !availableNetworks.includes(selectedNetwork)) {
            setSelectedNetwork(availableNetworks[0]!);
        }
    }, [availableNetworks, selectedNetwork]);

    const addresses = useMemo(() => {
        const map: Partial<Record<UsdtNetwork, string>> = {};
        for (const network of availableNetworks) {
            const address = addressByNetwork.get(network);
            if (address) map[network] = address;
        }
        return map;
    }, [addressByNetwork, availableNetworks]);

    const selectedAddress =
        addressByNetwork.get(selectedNetwork) ??
        addresses.BEP20 ??
        addresses.TRC20 ??
        addresses.ERC20 ??
        "";

    const qrValue = useMemo(() => {
        if (!selectedAddress) return "";
        return buildReceiveQrPayload({
            addresses,
            amount,
            asset: "USDT",
            network: selectedNetwork,
            fallbackAddress: selectedAddress,
            businessName: merchantName || undefined,
        });
    }, [addresses, amount, merchantName, selectedAddress, selectedNetwork]);

    const enlargedSize = Math.min(QR_ENLARGE_MAX, Math.floor(windowWidth * 0.78));

    const handleCopy = useCallback(async () => {
        if (!selectedAddress) return;
        const copied = await copyToClipboard(selectedAddress);
        showToast(
            copied ? t.wallet.accountNumberCopied : t.transaction.couldNotCopy,
            copied ? "success" : "error"
        );
    }, [selectedAddress, t.transaction.couldNotCopy, t.wallet.accountNumberCopied]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    width: "100%",
                    alignItems: "center",
                },
                hint: {
                    textAlign: "center",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 19,
                    marginBottom: 14,
                    paddingHorizontal: 4,
                },
                networkRow: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 16,
                },
                networkChip: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.white,
                },
                networkChipActive: {
                    borderColor: colors.accentBlue,
                    backgroundColor: colors.surfaceMuted,
                },
                networkChipText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.mainDark,
                },
                qrTouchable: {
                    alignSelf: "center",
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: colors.white,
                    marginBottom: 8,
                },
                tapHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginBottom: 12,
                },
                addressBlock: {
                    width: "100%",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 10,
                },
                addressLine: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.mainDark,
                    textAlign: "center",
                    lineHeight: 18,
                },
                networkLabel: {
                    textAlign: "center",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 8,
                },
                copyRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 8,
                    marginBottom: 8,
                },
                copyLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.linkColor,
                },
                autoNote: {
                    textAlign: "center",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 17,
                    paddingHorizontal: 8,
                },
                modalBackdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 24,
                },
                modalCard: {
                    width: "100%",
                    maxWidth: 360,
                    borderRadius: 16,
                    backgroundColor: colors.bgColor,
                    padding: 20,
                    alignItems: "center",
                },
                modalTitle: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    marginBottom: 4,
                },
                modalSubtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginBottom: 16,
                },
                modalClose: {
                    marginTop: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                },
                modalCloseText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 15,
                    color: colors.linkColor,
                },
            }),
        [FONTS, colors]
    );

    if (!qrValue && payment.qrCodeDataUrl) {
        return (
            <View style={styles.wrap}>
                <Text style={styles.hint}>{t.payment.qrAnyNetworkHint}</Text>
            </View>
        );
    }

    if (!qrValue) {
        return null;
    }

    const addressLines = splitAddressLines(selectedAddress);

    const renderQr = (size: number) => (
        <QRCode
            value={qrValue}
            size={size}
            logo={USDT_LOGO}
            logoSize={Math.round(size * 0.2)}
            logoBackgroundColor={colors.white}
            logoMargin={3}
            quietZone={6}
        />
    );

    return (
        <View style={styles.wrap}>
            <Text style={styles.hint}>{t.payment.qrAnyNetworkHint}</Text>

            <Pressable
                style={styles.qrTouchable}
                onPress={() => setEnlarged(true)}
                accessibilityRole="button"
                accessibilityLabel={t.payment.qrTapToEnlarge}
            >
                {renderQr(QR_COMPACT)}
            </Pressable>
            <Text style={styles.tapHint}>{t.payment.qrTapToEnlarge}</Text>

            <View style={styles.addressBlock}>
                {addressLines.map((line, index) => (
                    <Text key={index} style={styles.addressLine} selectable>
                        {line}
                    </Text>
                ))}
            </View>

            <TouchableOpacity style={styles.copyRow} onPress={() => void handleCopy()} accessibilityRole="button">
                <svg.CopySvg color={colors.linkColor} size={18} />
                <Text style={styles.copyLabel}>{t.payment.qrCopyAddress}</Text>
            </TouchableOpacity>

            <Text style={styles.autoNote}>{t.payment.qrAutoDetectNote}</Text>

            <Modal visible={enlarged} transparent animationType="fade" onRequestClose={() => setEnlarged(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setEnlarged(false)}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>{t.payment.qrEnlargeTitle}</Text>
                        <Text style={styles.modalSubtitle}>
                            {amount.toFixed(2)} USDT
                            {merchantName ? ` · ${merchantName}` : ""}
                        </Text>
                        <View style={{ padding: 12, backgroundColor: colors.white, borderRadius: 12 }}>
                            {renderQr(enlargedSize)}
                        </View>
                        <TouchableOpacity style={styles.modalClose} onPress={() => setEnlarged(false)}>
                            <Text style={styles.modalCloseText}>{t.common.done}</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

export default PaymentRequestQrPanel;
