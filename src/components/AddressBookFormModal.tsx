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

export type AddressBookFormValues = {
    name: string;
    address: string;
    network: UsdtNetwork;
};

type Props = {
    visible: boolean;
    mode: "create" | "edit";
    title: string;
    description?: string;
    initialValues: AddressBookFormValues;
    addressReadOnly?: boolean;
    networkReadOnly?: boolean;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (values: AddressBookFormValues) => void | Promise<void>;
    onDelete?: () => void;
};

const AddressBookFormModal: React.FC<Props> = ({
    visible,
    mode,
    title,
    description,
    initialValues,
    addressReadOnly = false,
    networkReadOnly = false,
    saving = false,
    onClose,
    onSubmit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [name, setName] = useState(initialValues.name);
    const [address, setAddress] = useState(initialValues.address);
    const [network, setNetwork] = useState<UsdtNetwork>(initialValues.network);

    useEffect(() => {
        if (!visible) return;
        setName(initialValues.name);
        setAddress(initialValues.address);
        setNetwork(initialValues.network);
    }, [visible, initialValues.address, initialValues.name, initialValues.network]);

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
                addressLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 6,
                },
                addressValue: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    lineHeight: 18,
                    color: colors.mainDark,
                    marginBottom: 16,
                },
                actions: {
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 4,
                },
                actionBtn: {
                    flex: 1,
                },
                deleteWrap: {
                    marginTop: 12,
                },
            }),
        [FONTS, colors.bgColor, colors.bodyTextColor, colors.mainDark]
    );

    const handleSubmit = () => {
        void onSubmit({ name: name.trim(), address: address.trim(), network });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.card}>
                    <Text style={styles.title}>{title}</Text>
                    {description ? <Text style={styles.description}>{description}</Text> : null}
                    {addressReadOnly ? (
                        <>
                            <Text style={styles.addressLabel}>{t.addressBook.savePromptAddressLabel}</Text>
                            <Text style={styles.addressValue}>{address}</Text>
                        </>
                    ) : null}
                    <components.InputField
                        placeholder={t.addressBook.namePlaceholder}
                        value={name}
                        onChangeText={setName}
                        containerStyle={{ marginBottom: 14 }}
                    />
                    {!addressReadOnly ? (
                        <components.InputField
                            placeholder={t.addressBook.addressPlaceholder}
                            value={address}
                            onChangeText={setAddress}
                            autoCapitalize="none"
                            containerStyle={{ marginBottom: 14 }}
                        />
                    ) : null}
                    {!networkReadOnly ? (
                        <components.NetworkSelector value={network} onChange={setNetwork} />
                    ) : null}
                    <View style={[styles.actions, { marginTop: networkReadOnly ? 0 : 16 }]}>
                        <components.Button
                            title={t.common.cancel}
                            onPress={onClose}
                            containerStyle={styles.actionBtn}
                        />
                        <components.Button
                            title={mode === "edit" ? t.common.save : t.addressBook.saveConfirm}
                            onPress={handleSubmit}
                            loading={saving}
                            disabled={saving}
                            containerStyle={styles.actionBtn}
                        />
                    </View>
                    {mode === "edit" && onDelete ? (
                        <View style={styles.deleteWrap}>
                            <components.Button
                                title={t.addressBook.deleteConfirm}
                                onPress={onDelete}
                                containerStyle={{ backgroundColor: colors.linkColor }}
                            />
                        </View>
                    ) : null}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AddressBookFormModal;
