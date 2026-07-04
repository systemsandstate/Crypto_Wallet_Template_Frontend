import {
    View,
    Text,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    } from "react-native";
import LoadingSpinner from "./LoadingSpinner";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "../hooks/useAppSelector";

import NetworkLogo from "./NetworkLogo";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { formatMessage } from "../i18n";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { loadAddressBook, type AddressBookEntry } from "../services/addressBookStorage";
import { RootState } from "../store/store";

type Props = {
    visible: boolean;
    network: UsdtNetwork;
    onClose: () => void;
    onSelect: (entry: AddressBookEntry) => void;
};

const AddressBookPickerModal: React.FC<Props> = ({ visible, network, onClose, onSelect }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [entries, setEntries] = useState<AddressBookEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!merchant?.id) {
            setEntries([]);
            return;
        }
        setLoading(true);
        const items = await loadAddressBook(merchant.id);
        setEntries(items.filter((entry) => entry.network === network));
        setLoading(false);
    }, [merchant?.id, network]);

    useEffect(() => {
        if (visible) void load();
    }, [visible, load]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end",
                },
                sheet: {
                    backgroundColor: colors.bgColor,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: "80%",
                    paddingBottom: Math.max(insets.bottom, 16),
                },
                handle: {
                    alignSelf: "center",
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                    marginTop: 10,
                    marginBottom: 8,
                },
                header: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
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
                description: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    paddingHorizontal: 24,
                    marginBottom: 12,
                    lineHeight: 13 * 1.5,
                },
                body: {
                    paddingHorizontal: 20,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceMuted,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                meta: {
                    flex: 1,
                    marginLeft: 10,
                    minWidth: 0,
                },
                name: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                },
                address: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 11,
                    color: colors.bodyTextColor,
                    marginTop: 4,
                    lineHeight: 16,
                },
                networkText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 10,
                    color: colors.bodyTextColor,
                },
                empty: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    paddingVertical: 28,
                    lineHeight: 14 * 1.6,
                },
            }),
        [FONTS, colors, insets.bottom]
    );

    const networkLabel = getLocalizedNetworkLabel(network, t);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <View style={{ width: 36 }} />
                        <Text style={styles.title}>{t.withdraw.pickFromAddressBook}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel={t.common.cancel}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.description}>
                        {formatMessage(t.withdraw.addressBookForNetwork, { network: networkLabel })}
                    </Text>
                    <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
                        {loading ? (
                            <LoadingSpinner size={40} style={{ marginVertical: 24 }} />
                        ) : entries.length === 0 ? (
                            <Text style={styles.empty}>{t.withdraw.addressBookEmptyForNetwork}</Text>
                        ) : (
                            entries.map((entry) => (
                                <TouchableOpacity
                                    key={entry.id}
                                    style={styles.row}
                                    activeOpacity={0.75}
                                    onPress={() => {
                                        onSelect(entry);
                                        onClose();
                                    }}
                                >
                                    <NetworkLogo network={entry.network} size={32} />
                                    <View style={styles.meta}>
                                        <Text style={styles.name} numberOfLines={1}>
                                            {entry.name}
                                        </Text>
                                        <Text style={styles.address} numberOfLines={2}>
                                            {entry.address}
                                        </Text>
                                    </View>
                                    <Text style={styles.networkText}>{entry.network}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default AddressBookPickerModal;
