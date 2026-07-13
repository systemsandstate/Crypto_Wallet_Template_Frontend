import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
        StyleSheet} from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";
import { useAppSelector } from "../hooks/useAppSelector";

import AddressBookBatchEditModal from "../components/AddressBookBatchEditModal";
import AddressBookFormModal, { AddressBookFormValues } from "../components/AddressBookFormModal";
import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { RootState } from "../store/store";
import {
    addAddressBookEntry,
    loadAddressBook,
    removeAddressBookEntries,
    updateAddressBookEntry,
    updateAddressBookEntriesBatch,
    type AddressBookEntry} from "../services/addressBookStorage";
import { DEFAULT_USDT_NETWORK, USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { formatMessage } from "../i18n";
import { confirmAction } from "../utils/confirm";
import { appAlert } from '../utils/appAlert';
import { showToast } from "../utils/toast";
import { api } from "../services/api";
import { isRecipientEmail } from "../utils/isRecipientEmail";
import { isValidSendAddress } from "../utils/isEvmAddress";
import {
    normalizeAddressBookAddresses,
    pickDefaultAddressBookNetwork,
    trimAddressBookInputs,
} from "../utils/addressBookNetworks";

const emptyForm = (network: UsdtNetwork = DEFAULT_USDT_NETWORK): AddressBookFormValues => ({
    name: "",
    address: "",
    network,
    email: "",
    addresses: {},
});

const AddressBook: React.FC = () => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const insets = useSafeAreaInsets();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [entries, setEntries] = useState<AddressBookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [batchEditVisible, setBatchEditVisible] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formValues, setFormValues] = useState<AddressBookFormValues>(emptyForm());
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!merchant?.id) {
            setEntries([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const items = await loadAddressBook(merchant.id);
        setEntries(items);
        setLoading(false);
    }, [merchant?.id]);

    useInitialScreenLoad(load);

    const selectedCount = selectedIds.length;
    const allSelected =
        entries.length > 0 && entries.every((entry) => selectedIds.includes(entry.id));

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedIds([]);
    };

    const toggleSelected = (id: string) => {
        setSelectedIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(entries.map((entry) => entry.id));
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingId(null);
        setFormValues(emptyForm());
    };

    const openCreate = () => {
        exitSelectionMode();
        setModalMode("create");
        setEditingId(null);
        setFormValues(emptyForm());
        setModalVisible(true);
    };

    const openEdit = (entry: AddressBookEntry) => {
        setModalMode("edit");
        setEditingId(entry.id);
        setFormValues({
            name: entry.name,
            address: entry.address,
            network: entry.network,
            email: entry.email ?? "",
            addresses: entry.addresses ?? {},
        });
        setModalVisible(true);
    };

    const handleCardPress = (entry: AddressBookEntry) => {
        if (selectionMode) {
            toggleSelected(entry.id);
            return;
        }
        openEdit(entry);
    };

    const handleBatchEdit = () => {
        if (selectedCount === 0) return;
        if (selectedCount === 1) {
            const entry = entries.find((item) => item.id === selectedIds[0]);
            if (entry) openEdit(entry);
            return;
        }
        setBatchEditVisible(true);
    };

    const handleBatchDelete = () => {
        if (!merchant?.id || selectedCount === 0) return;
        confirmAction({
            title: t.addressBook.batchDeleteTitle,
            message: formatMessage(t.addressBook.batchDeleteMessage, {
                count: String(selectedCount)}),
            confirmLabel: t.addressBook.batchDelete,
            cancelLabel: t.common.cancel,
            destructive: true,
            onConfirm: () => {
                void removeAddressBookEntries(merchant.id, selectedIds).then((updated) => {
                    setEntries(updated);
                    exitSelectionMode();
                    showToast(
                        formatMessage(t.addressBook.batchDeletedToast, {
                            count: String(selectedCount)})
                    );
                });
            }});
    };

    const handleBatchEditSubmit = async (network: UsdtNetwork) => {
        if (!merchant?.id || selectedCount === 0) return;
        setSaving(true);
        try {
            const updated = await updateAddressBookEntriesBatch(merchant.id, selectedIds, { network });
            setEntries(updated);
            setBatchEditVisible(false);
            exitSelectionMode();
            showToast(
                formatMessage(t.addressBook.batchUpdatedToast, {
                    count: String(selectedCount)})
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (values: AddressBookFormValues) => {
        if (!merchant?.id) return;

        let payload: {
            name: string;
            address: string;
            network: UsdtNetwork;
            email?: string;
            addresses?: Partial<Record<UsdtNetwork, string>>;
        } = {
            name: values.name.trim(),
            address: values.address.trim(),
            network: values.network,
            email: values.email?.trim().toLowerCase() || undefined,
        };

        setSaving(true);
        try {
            if (modalMode === "create" && values.addMethod === "email") {
                const email = values.email?.trim().toLowerCase() ?? "";
                if (!email || !isRecipientEmail(email)) {
                    appAlert.alert(t.common.error, t.addressBook.emailRequired);
                    return;
                }
                if (entries.some((entry) => entry.email?.trim().toLowerCase() === email)) {
                    appAlert.alert(t.common.error, t.addressBook.duplicateEmail);
                    return;
                }

                const lookupRes = await api.lookupWalletRecipient({ email });
                const data = lookupRes.data;
                if (data.isSelf) {
                    appAlert.alert(t.common.error, t.withdraw.cannotSendToSelf);
                    return;
                }
                if (!data.found || !data.resolvedAddress) {
                    appAlert.alert(t.common.error, t.withdraw.recipientEmailNotFound);
                    return;
                }

                const resolvedNetwork =
                    data.defaultNetwork &&
                    (USDT_NETWORKS as readonly string[]).includes(data.defaultNetwork)
                        ? (data.defaultNetwork as UsdtNetwork)
                        : data.network &&
                            (USDT_NETWORKS as readonly string[]).includes(data.network)
                          ? (data.network as UsdtNetwork)
                          : DEFAULT_USDT_NETWORK;

                const addresses = normalizeAddressBookAddresses(
                    data.addresses as Partial<Record<UsdtNetwork, string>> | undefined,
                    resolvedNetwork,
                    data.resolvedAddress.trim()
                );
                const primaryAddress = addresses[resolvedNetwork] ?? data.resolvedAddress.trim();

                payload = {
                    name: data.businessName?.trim() || email,
                    address: primaryAddress,
                    network: resolvedNetwork,
                    email,
                    addresses,
                };
            } else if (modalMode === "edit" && payload.email) {
                const lookupRes = await api.lookupWalletRecipient({ email: payload.email });
                const data = lookupRes.data;
                if (!data.found || !data.resolvedAddress) {
                    appAlert.alert(t.common.error, t.withdraw.recipientEmailNotFound);
                    return;
                }

                const resolvedNetwork =
                    data.defaultNetwork &&
                    (USDT_NETWORKS as readonly string[]).includes(data.defaultNetwork)
                        ? (data.defaultNetwork as UsdtNetwork)
                        : data.network &&
                            (USDT_NETWORKS as readonly string[]).includes(data.network)
                          ? (data.network as UsdtNetwork)
                          : DEFAULT_USDT_NETWORK;
                const addresses = normalizeAddressBookAddresses(
                    data.addresses as Partial<Record<UsdtNetwork, string>> | undefined,
                    resolvedNetwork,
                    data.resolvedAddress.trim()
                );

                payload = {
                    name: data.businessName?.trim() || payload.email,
                    address: addresses[resolvedNetwork] ?? data.resolvedAddress.trim(),
                    network: resolvedNetwork,
                    email: payload.email,
                    addresses,
                };
            } else {
                if (!payload.name) {
                    appAlert.alert(t.common.error, t.addressBook.nameRequired);
                    return;
                }

                const addresses = trimAddressBookInputs(values.addresses);
                if (!Object.keys(addresses).length) {
                    appAlert.alert(t.common.error, t.addressBook.addressRequired);
                    return;
                }

                for (const network of USDT_NETWORKS) {
                    const value = addresses[network];
                    if (value && !isValidSendAddress(network, value)) {
                        appAlert.alert(
                            t.common.error,
                            formatMessage(t.addressBook.invalidNetworkAccount, { network })
                        );
                        return;
                    }
                }

                const defaultNetwork = pickDefaultAddressBookNetwork(addresses);
                payload = {
                    name: payload.name,
                    address: addresses[defaultNetwork]!,
                    network: defaultNetwork,
                    email: undefined,
                    addresses,
                };
            }

            if (modalMode === "edit" && editingId) {
                const updated = await updateAddressBookEntry(merchant.id, editingId, payload);
                setEntries(updated);
                showToast(t.addressBook.updatedToast);
            } else {
                const updated = await addAddressBookEntry(merchant.id, payload);
                setEntries(updated);
                showToast(t.addressBook.savedToast);
            }
            closeModal();
            if (selectionMode) {
                exitSelectionMode();
            }
        } catch {
            if (modalMode === "create" && values.addMethod === "email") {
                appAlert.alert(t.common.error, t.withdraw.recipientEmailNotFound);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!merchant?.id || !editingId) return;
        confirmAction({
            title: t.addressBook.deleteTitle,
            message: t.addressBook.deleteMessage,
            confirmLabel: t.addressBook.deleteConfirm,
            cancelLabel: t.common.cancel,
            destructive: true,
            onConfirm: () => {
                void removeAddressBookEntries(merchant.id, [editingId]).then((updated) => {
                    setEntries(updated);
                    closeModal();
                    exitSelectionMode();
                });
            }});
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                selectionBar: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 8},
                selectionAction: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: colors.linkColor},
                selectionMeta: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    flex: 1},
                card: {
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    borderWidth: 2,
                    borderColor: "transparent"},
                cardSelected: {
                    borderColor: colors.linkColor,
                    backgroundColor: colors.surfaceMuted},
                checkbox: {
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: colors.border,
                    marginRight: 12,
                    marginTop: 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.white},
                checkboxChecked: {
                    borderColor: colors.linkColor,
                    backgroundColor: colors.linkColor},
                checkboxMark: {
                    color: colors.white,
                    fontSize: 14,
                    lineHeight: 16,
                    fontWeight: "700"},
                cardBody: {
                    flex: 1,
                    minWidth: 0},
                name: {
                    ...FONTS.H6,
                    color: colors.mainDark,
                    marginBottom: 4},
                network: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.linkColor,
                    marginBottom: 4},
                emailText: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    marginBottom: 6},
                address: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 18},
                empty: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    lineHeight: 14 * 1.6,
                    paddingHorizontal: 12},
                emptyWrap: {
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 160,
                    paddingHorizontal: 12},
                batchFooter: {
                    flexDirection: "row",
                    gap: 10,
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.bgColor},
                batchBtn: {
                    flex: 1},
                deleteBtn: {
                    backgroundColor: colors.linkColor},
                addFooter: {
                    paddingHorizontal: 20,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.bgColor}}),
        [colors, FONTS]
    );

    const bottomInset = Math.max(insets.bottom, 12);
    const showAddFooter = !selectionMode;
    const showBatchFooter = selectionMode && selectedCount > 0;
    const scrollBottomPadding = (showAddFooter || showBatchFooter ? 56 : 16) + bottomInset;

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header title={t.addressBook.title} goBack={true} />
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: scrollBottomPadding }}>
                    <components.MerchantContent style={{ flex: 1, paddingTop: 16 }}>
                        <Text
                            style={{
                                ...FONTS.Mulish_400Regular,
                                fontSize: 14,
                                color: colors.bodyTextColor,
                                lineHeight: 14 * 1.6,
                                marginBottom: 16,
                                textAlign: "center"}}
                        >
                            {t.addressBook.subtitle}
                        </Text>

                        {!loading && entries.length > 0 ? (
                            <View style={styles.selectionBar}>
                                {selectionMode ? (
                                    <>
                                        <TouchableOpacity onPress={exitSelectionMode}>
                                            <Text style={styles.selectionAction}>
                                                {t.addressBook.cancelSelect}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.selectionMeta}>
                                            {selectedCount > 0
                                                ? formatMessage(t.addressBook.selectedCount, {
                                                      count: String(selectedCount)})
                                                : t.addressBook.selectHint}
                                        </Text>
                                        <TouchableOpacity onPress={handleSelectAll}>
                                            <Text style={styles.selectionAction}>
                                                {allSelected
                                                    ? t.addressBook.clearSelection
                                                    : t.addressBook.selectAll}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <View style={{ flex: 1 }} />
                                        <TouchableOpacity onPress={() => setSelectionMode(true)}>
                                            <Text style={styles.selectionAction}>
                                                {t.addressBook.selectMode}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        ) : null}

                        {loading ? (
                            <View style={styles.emptyWrap}>
                                <LoadingSpinner size={40} />
                            </View>
                        ) : entries.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.empty}>{t.addressBook.empty}</Text>
                            </View>
                        ) : (
                            entries.map((entry) => {
                                const isSelected = selectedIds.includes(entry.id);
                                return (
                                    <TouchableOpacity
                                        key={entry.id}
                                        style={[styles.card, isSelected && styles.cardSelected]}
                                        activeOpacity={0.75}
                                        onPress={() => handleCardPress(entry)}
                                    >
                                        {selectionMode ? (
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    isSelected && styles.checkboxChecked,
                                                ]}
                                            >
                                                {isSelected ? (
                                                    <Text style={styles.checkboxMark}>✓</Text>
                                                ) : null}
                                            </View>
                                        ) : null}
                                        <View style={styles.cardBody}>
                                            <Text style={styles.name}>{entry.name}</Text>
                                            {entry.email ? (
                                                <Text style={styles.emailText}>{entry.email}</Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}

                    </components.MerchantContent>
                </ScrollView>

                {showAddFooter ? (
                    <View style={[styles.addFooter, { paddingBottom: bottomInset }]}>
                        <components.Button
                            title={t.addressBook.addContact}
                            onPress={openCreate}
                            size="compact"
                        />
                    </View>
                ) : null}

                {showBatchFooter ? (
                    <View style={[styles.batchFooter, { paddingBottom: bottomInset }]}>
                        <components.Button
                            title={t.addressBook.batchDelete}
                            onPress={handleBatchDelete}
                            size="compact"
                            containerStyle={[styles.batchBtn, styles.deleteBtn]}
                        />
                        <components.Button
                            title={t.addressBook.batchEdit}
                            onPress={handleBatchEdit}
                            size="compact"
                            containerStyle={styles.batchBtn}
                        />
                    </View>
                ) : null}
            </SafeAreaView>

            <AddressBookFormModal
                visible={modalVisible}
                mode={modalMode}
                title={modalMode === "edit" ? t.addressBook.editContact : t.addressBook.addContact}
                initialValues={formValues}
                saving={saving}
                onClose={closeModal}
                onSubmit={handleSubmit}
                onDelete={modalMode === "edit" ? handleDelete : undefined}
            />

            <AddressBookBatchEditModal
                visible={batchEditVisible}
                count={selectedCount}
                initialNetwork={
                    entries.find((item) => selectedIds.includes(item.id))?.network ??
                    DEFAULT_USDT_NETWORK
                }
                saving={saving}
                onClose={() => setBatchEditVisible(false)}
                onSubmit={handleBatchEditSubmit}
            />
        </View>
    );
};

export default AddressBook;
