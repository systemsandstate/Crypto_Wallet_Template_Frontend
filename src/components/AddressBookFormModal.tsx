import {
    View,
    Text,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";

import { components } from ".";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { DEFAULT_USDT_NETWORK, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import { normalizeAddressBookAddresses } from "../utils/addressBookNetworks";

export type AddressBookAddMethod = "manual" | "email";

export type AddressBookFormValues = {
    name: string;
    address: string;
    network: UsdtNetwork;
    email?: string;
    addresses?: Partial<Record<UsdtNetwork, string>>;
    addMethod?: AddressBookAddMethod;
};

type Props = {
    visible: boolean;
    mode: "create" | "edit";
    title: string;
    description?: string;
    initialValues: AddressBookFormValues;
    addressReadOnly?: boolean;
    saving?: boolean;
    onClose: () => void;
    onSubmit: (values: AddressBookFormValues) => void | Promise<void>;
    onDelete?: () => void;
};

const emptyNetworkAddresses = (): Partial<Record<UsdtNetwork, string>> => ({
    TRC20: "",
    ERC20: "",
    BEP20: "",
});

const AddressBookFormModal: React.FC<Props> = ({
    visible,
    mode,
    title,
    description,
    initialValues,
    addressReadOnly = false,
    saving = false,
    onClose,
    onSubmit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [addMethod, setAddMethod] = useState<AddressBookAddMethod>("manual");
    const [name, setName] = useState(initialValues.name);
    const [address, setAddress] = useState(initialValues.address);
    const [email, setEmail] = useState(initialValues.email ?? "");
    const [networkAddresses, setNetworkAddresses] = useState<Partial<Record<UsdtNetwork, string>>>(
        emptyNetworkAddresses()
    );

    const isAppUser = Boolean(initialValues.email?.trim());
    const showEmailMode = mode === "create" && addMethod === "email";
    const showManualFields = !showEmailMode && !addressReadOnly && !(mode === "edit" && isAppUser);

    const appUserAddresses = useMemo(
        () =>
            normalizeAddressBookAddresses(
                initialValues.addresses,
                initialValues.network,
                initialValues.address
            ),
        [initialValues.address, initialValues.addresses, initialValues.network]
    );
    const appUserNetworks = useMemo(
        () => USDT_NETWORKS.filter((networkKey) => Boolean(appUserAddresses[networkKey]?.trim())),
        [appUserAddresses]
    );

    useEffect(() => {
        if (!visible) return;
        setAddMethod(initialValues.email ? "email" : "manual");
        setName(initialValues.name);
        setAddress(initialValues.address);
        setEmail(initialValues.email ?? "");
        const normalized = normalizeAddressBookAddresses(
            initialValues.addresses,
            initialValues.network,
            initialValues.address
        );
        setNetworkAddresses({
            TRC20: normalized.TRC20 ?? "",
            ERC20: normalized.ERC20 ?? "",
            BEP20: normalized.BEP20 ?? "",
        });
    }, [
        visible,
        initialValues.address,
        initialValues.addresses,
        initialValues.email,
        initialValues.name,
        initialValues.network,
    ]);

    const setNetworkAddress = (networkKey: UsdtNetwork, value: string) => {
        setNetworkAddresses((current) => ({ ...current, [networkKey]: value }));
    };

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
                    maxHeight: "92%",
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
                methodRow: {
                    flexDirection: "row",
                    gap: 8,
                    marginBottom: 16,
                },
                methodChip: {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.white,
                    alignItems: "center",
                },
                methodChipActive: {
                    borderColor: colors.accentBlue,
                    backgroundColor: colors.surfaceMuted,
                },
                methodChipText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.mainDark,
                    textAlign: "center",
                },
                methodHint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    lineHeight: 12 * 1.5,
                    marginBottom: 14,
                },
                fieldLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 6,
                },
                readOnlyValue: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    lineHeight: 18,
                    color: colors.mainDark,
                    marginBottom: 14,
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
                deleteButton: {
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.linkColor,
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                },
                deleteButtonText: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.linkColor,
                },
            }),
        [FONTS, colors]
    );

    const handleSubmit = () => {
        if (mode === "create" && addMethod === "email") {
            void onSubmit({
                name: "",
                address: "",
                network: DEFAULT_USDT_NETWORK,
                email: email.trim().toLowerCase(),
                addMethod: "email",
            });
            return;
        }

        void onSubmit({
            name: name.trim(),
            address: address.trim(),
            network: DEFAULT_USDT_NETWORK,
            addresses: networkAddresses,
            email: email.trim() || undefined,
            addMethod: "manual",
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.card}>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Text style={styles.title}>{title}</Text>
                        {description ? <Text style={styles.description}>{description}</Text> : null}

                        {mode === "create" ? (
                            <>
                                <View style={styles.methodRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.methodChip,
                                            addMethod === "manual" && styles.methodChipActive,
                                        ]}
                                        onPress={() => setAddMethod("manual")}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: addMethod === "manual" }}
                                    >
                                        <Text style={styles.methodChipText}>{t.addressBook.addManual}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.methodChip,
                                            addMethod === "email" && styles.methodChipActive,
                                        ]}
                                        onPress={() => setAddMethod("email")}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: addMethod === "email" }}
                                    >
                                        <Text style={styles.methodChipText}>{t.addressBook.addByEmail}</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.methodHint}>
                                    {addMethod === "email"
                                        ? t.addressBook.addByEmailHint
                                        : t.addressBook.addManualHint}
                                </Text>
                            </>
                        ) : null}

                        {addressReadOnly ? (
                            <>
                                <Text style={styles.fieldLabel}>{t.addressBook.savePromptAddressLabel}</Text>
                                <Text style={styles.readOnlyValue}>{address}</Text>
                            </>
                        ) : null}

                        {mode === "edit" && isAppUser ? (
                            <>
                                <Text style={styles.fieldLabel}>{t.addressBook.contactNameLabel}</Text>
                                <Text style={styles.readOnlyValue}>{name}</Text>
                                <Text style={styles.fieldLabel}>{t.payByEmail.emailLabel}</Text>
                                <Text style={styles.readOnlyValue}>{email}</Text>
                                {appUserNetworks.map((networkKey) => (
                                    <View key={networkKey} style={{ marginBottom: 12 }}>
                                        <Text style={styles.fieldLabel}>
                                            {networkKey} · {t.wallet.accountNumberLabel}
                                        </Text>
                                        <Text style={styles.readOnlyValue} selectable>
                                            {appUserAddresses[networkKey]}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        ) : null}

                        {showEmailMode ? (
                            <components.InputField
                                placeholder={t.payByEmail.emailPlaceholder}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                containerStyle={{ marginBottom: 14 }}
                            />
                        ) : null}

                        {showManualFields ? (
                            <>
                                <components.InputField
                                    placeholder={t.addressBook.namePlaceholder}
                                    value={name}
                                    onChangeText={setName}
                                    containerStyle={{ marginBottom: 14 }}
                                />
                                {USDT_NETWORKS.map((networkKey) => (
                                    <View key={networkKey} style={{ marginBottom: 12 }}>
                                        <Text style={styles.fieldLabel}>
                                            {networkKey} · {t.wallet.accountNumberLabel}
                                        </Text>
                                        <components.InputField
                                            placeholder={t.addressBook.networkAccountOptional}
                                            value={networkAddresses[networkKey] ?? ""}
                                            onChangeText={(value) => setNetworkAddress(networkKey, value)}
                                            autoCapitalize="none"
                                            containerStyle={{ marginBottom: 0 }}
                                        />
                                    </View>
                                ))}
                            </>
                        ) : null}

                        <View style={styles.actions}>
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
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={onDelete}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.deleteButtonText}>{t.addressBook.deleteConfirm}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AddressBookFormModal;
