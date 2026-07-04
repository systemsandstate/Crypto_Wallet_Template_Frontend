import {
    View,
    Text,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";

import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { formatMessage } from "../i18n";

type Props = {
    visible: boolean;
    count: number;
    initialNetwork: UsdtNetwork;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (network: UsdtNetwork) => void | Promise<void>;
};

const AddressBookBatchEditModal: React.FC<Props> = ({
    visible,
    count,
    initialNetwork,
    saving = false,
    onClose,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [network, setNetwork] = useState<UsdtNetwork>(initialNetwork);

    useEffect(() => {
        if (visible) {
            setNetwork(initialNetwork);
        }
    }, [visible, initialNetwork]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    justifyContent: "center",
                    padding: 24,
                },
                card: {
                    backgroundColor: colors.bgColor,
                    borderRadius: 16,
                    padding: 20,
                },
                title: {
                    ...FONTS.H4,
                    color: colors.mainDark,
                    marginBottom: 8,
                    textAlign: "center",
                },
                description: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    marginBottom: 16,
                    lineHeight: 14 * 1.5,
                },
                actions: {
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 16,
                },
                actionBtn: {
                    flex: 1,
                },
            }),
        [FONTS, colors.bgColor, colors.bodyTextColor, colors.mainDark]
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.card}>
                    <Text style={styles.title}>{t.addressBook.batchEditTitle}</Text>
                    <Text style={styles.description}>
                        {formatMessage(t.addressBook.batchEditDescription, { count: String(count) })}
                    </Text>
                    <components.NetworkSelector value={network} onChange={setNetwork} />
                    <View style={styles.actions}>
                        <components.Button
                            title={t.common.cancel}
                            onPress={onClose}
                            containerStyle={styles.actionBtn}
                        />
                        <components.Button
                            title={t.common.save}
                            onPress={() => void onSubmit(network)}
                            loading={saving}
                            disabled={saving}
                            containerStyle={styles.actionBtn}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AddressBookBatchEditModal;
