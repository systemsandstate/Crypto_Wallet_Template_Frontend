import {
    Text,
    View,
    StyleSheet,
    Linking,
    TouchableOpacity} from "react-native";
import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";
import { useAppSelector } from "../hooks/useAppSelector";

import AddressBookFormModal, { AddressBookFormValues } from "../components/AddressBookFormModal";
import TransactionDetailAvatar from "../components/TransactionDetailAvatar";
import { components } from "../components";
import { theme } from "../constants";
import { api, WalletTransfer, invalidateCachedGet, isCachedGetFresh } from "../services/api";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { formatMessage } from "../i18n";
import { copyToClipboard } from "../utils/copyToClipboard";
import { appAlert } from '../utils/appAlert';
import { formatUsdtAmount, formatNativeAmount } from "../utils/formatAmount";
import { showToast } from "../utils/toast";
import { getTxExplorerUrl } from "../utils/explorerUrl";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { svg } from "../svg";
import { UsdtNetwork } from "../constants/usdtNetworks";
import {
    addAddressBookEntry,
    loadAddressBook,
    updateAddressBookEntry,
    type AddressBookEntry} from "../services/addressBookStorage";
import { findAddressBookEntry } from "../utils/addressBookMatch";
import {
    formatShortTransactionId,
    resolveCounterpartyLabel,
    type CounterpartyLabel,
} from "../utils/resolveCounterpartyLabel";
import { RootState } from "../store/store";
import { navigateUp } from "../navigation/navigateUp";

type RouteParams = {
    deposit: WalletTransfer;
};

const WalletDepositDetails: React.FC = ({ navigation, route }: any) => {
    const { t, dateLocale } = useTranslation();
    const { colors, FONTS } = useTheme();
    const tabBarInset = useTabBarInset();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const initialDeposit = route.params?.deposit as WalletTransfer | undefined;
    const [deposit, setDeposit] = useState<WalletTransfer | undefined>(initialDeposit);
    const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
    const [fromLabel, setFromLabel] = useState<CounterpartyLabel | null>(null);
    const [toLabel, setToLabel] = useState<CounterpartyLabel | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [formValues, setFormValues] = useState<AddressBookFormValues>({
        name: "",
        address: "",
        network: "BEP20"});
    const [savingContact, setSavingContact] = useState(false);

    const loadDetails = useCallback(async () => {
        const entries = merchant?.id ? await loadAddressBook(merchant.id) : [];
        setAddressBook(entries);

        const labelStrings = {
            appUser: t.withdraw.recipientAppUser,
            contact: t.withdraw.recipientContact,
            external: t.withdraw.recipientExternal,
            unknown: t.transaction.counterpartyUnknown,
            self: t.transaction.yourAccount,
        };
        const network = (initialDeposit?.network ?? "BEP20") as UsdtNetwork;

        const [fromResolved, toResolved] = await Promise.all([
            resolveCounterpartyLabel(initialDeposit?.fromAddress, network, entries, labelStrings),
            resolveCounterpartyLabel(initialDeposit?.toAddress, network, entries, labelStrings),
        ]);
        setFromLabel(fromResolved);
        setToLabel(toResolved);

        if (!initialDeposit?.id) return;
        if (!isCachedGetFresh("/merchant/wallets/transfers", 15_000)) {
            invalidateCachedGet("/merchant/wallets/transfers");
        }
        try {
            const res = await api.getWalletTransfers();
            const fresh = (res.data.transfers ?? []).find((row) => row.id === initialDeposit.id);
            if (fresh) {
                setDeposit(fresh);
                const freshNetwork = fresh.network as UsdtNetwork;
                const [freshFrom, freshTo] = await Promise.all([
                    resolveCounterpartyLabel(fresh.fromAddress, freshNetwork, entries, labelStrings),
                    resolveCounterpartyLabel(fresh.toAddress, freshNetwork, entries, labelStrings),
                ]);
                setFromLabel(freshFrom);
                setToLabel(freshTo);
            }
        } catch {
            // keep route params deposit
        }
    }, [
        initialDeposit?.fromAddress,
        initialDeposit?.id,
        initialDeposit?.network,
        initialDeposit?.toAddress,
        merchant?.id,
        t,
    ]);

    useInitialScreenLoad(loadDetails);

    const copyText = useCallback(
        async (label: string, value: string) => {
            const copied = await copyToClipboard(value);
            if (copied) {
                showToast(formatMessage(t.transaction.copiedToClipboard, { label }));
            } else {
                showToast(t.transaction.couldNotCopy, "error");
            }
        },
        [t]
    );

    const closeModal = useCallback(() => {
        setModalVisible(false);
        setEditingEntryId(null);
    }, []);

    const openSaveModal = useCallback((address: string, network: UsdtNetwork) => {
        if (!address) return;
        setModalMode("create");
        setEditingEntryId(null);
        setFormValues({ name: "", address, network });
        setModalVisible(true);
    }, []);

    const openEditModal = useCallback((entry: AddressBookEntry) => {
        setModalMode("edit");
        setEditingEntryId(entry.id);
        setFormValues({
            name: entry.name,
            address: entry.address,
            network: entry.network});
        setModalVisible(true);
    }, []);

    const handleSubmitContact = useCallback(
        async (values: AddressBookFormValues) => {
            if (!merchant?.id) return;
            if (!values.name) {
                appAlert.alert(t.common.error, t.addressBook.nameRequired);
                return;
            }
            setSavingContact(true);
            try {
                if (modalMode === "edit" && editingEntryId) {
                    await updateAddressBookEntry(merchant.id, editingEntryId, {
                        name: values.name});
                    showToast(t.addressBook.updatedToast);
                } else {
                    await addAddressBookEntry(merchant.id, values);
                    showToast(t.addressBook.savedToast);
                }
                await loadAddressBook(merchant.id).then(setAddressBook);
                closeModal();
            } finally {
                setSavingContact(false);
            }
        },
        [closeModal, editingEntryId, merchant?.id, modalMode, t]
    );

    const openExplorer = useCallback(() => {
        if (!deposit?.txHash) return;
        const url = getTxExplorerUrl(deposit.network, deposit.txHash);
        if (!url) {
            showToast(t.payment.explorerUnavailable, "error");
            return;
        }
        Linking.openURL(url).catch(() => showToast(t.payment.explorerUnavailable, "error"));
    }, [deposit, t]);

    if (!deposit) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
                <components.Header goBack={true} />
                <Text style={{ textAlign: "center", marginTop: 40, color: theme.COLORS.bodyTextColor }}>
                    {t.transaction.paymentNotFound}
                </Text>
            </SafeAreaView>
        );
    }

    const dateStr = new Date(deposit.timestamp).toLocaleString();
    const networkLabel = getLocalizedNetworkLabel(deposit.network as UsdtNetwork, t);
    const depositNetwork = deposit.network as UsdtNetwork;
    const savedFromEntry = deposit.fromAddress
        ? findAddressBookEntry(addressBook, deposit.fromAddress, depositNetwork)
        : undefined;

    const counterpartyKindHint = (label: CounterpartyLabel | null) => {
        if (!label) return null;
        if (label.kind === "app") return t.withdraw.recipientAppUser;
        if (label.kind === "contact") return t.withdraw.recipientContact;
        if (label.kind === "self") return t.transaction.yourAccount;
        if (label.kind === "external") return t.withdraw.recipientExternal;
        return null;
    };

    const isSend = deposit.type === "SEND";
    const headerCounterparty = isSend ? toLabel : fromLabel;
    const formattedAmount =
        deposit.currency === "USDT"
            ? formatUsdtAmount(deposit.amount, dateLocale)
            : formatNativeAmount(deposit.amount, dateLocale);

    const CounterpartyDetail = ({
        leftTitle,
        label,
        address,
        allowAddressBook = false,
        savedEntry}: {
        leftTitle: string;
        label: CounterpartyLabel | null;
        address: string;
        allowAddressBook?: boolean;
        savedEntry?: AddressBookEntry;
    }) => (
        <View
            style={{
                paddingVertical: 17,
                borderBottomWidth: 1,
                borderBottomColor: "#CED6E1"}}
        >
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_400Regular,
                            fontSize: 16,
                            lineHeight: 16 * 1.6,
                            color: theme.COLORS.bodyTextColor,
                            marginBottom: 4}}
                    >
                        {leftTitle}
                    </Text>
                    <Text
                        style={{
                            ...theme.FONTS.Mulish_600SemiBold,
                            fontSize: 16,
                            lineHeight: 22,
                            color: theme.COLORS.mainDark}}
                    >
                        {label?.name || t.transaction.counterpartyUnknown}
                    </Text>
                    {counterpartyKindHint(label) ? (
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 12,
                                lineHeight: 18,
                                color: theme.COLORS.bodyTextColor,
                                marginTop: 4}}
                        >
                            {counterpartyKindHint(label)}
                        </Text>
                    ) : null}
                </View>
                {allowAddressBook && address ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        {savedEntry ? (
                            <TouchableOpacity
                                onPress={() => openEditModal(savedEntry)}
                                accessibilityRole="button"
                                accessibilityLabel={t.addressBook.editContact}
                            >
                                <svg.AddressBookSvg color={theme.COLORS.mainDark} size={20} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => openSaveModal(address, depositNetwork)}
                                accessibilityRole="button"
                                accessibilityLabel={t.addressBook.savePromptTitle}
                            >
                                <svg.AddressBookSvg color={theme.COLORS.mainDark} size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
            </View>
        </View>
    );

    const TransactionIdDetail = ({ txHash }: { txHash: string }) => (
        <View
            style={{
                paddingVertical: 17,
                borderBottomWidth: 1,
                borderBottomColor: "#CED6E1"}}
        >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text
                    style={{
                        ...theme.FONTS.Mulish_400Regular,
                        fontSize: 16,
                        lineHeight: 16 * 1.6,
                        color: theme.COLORS.bodyTextColor,
                        flex: 1,
                        marginRight: 12}}
                >
                    {t.transaction.txHash}
                </Text>
                <TouchableOpacity
                    onPress={() => copyText(t.transaction.txHash, txHash)}
                    accessibilityRole="button"
                    accessibilityLabel={t.transaction.copyTransactionId}
                >
                    <svg.CopySvg color={theme.COLORS.mainDark} size={20} />
                </TouchableOpacity>
            </View>
            <Text
                style={{
                    ...theme.FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    lineHeight: 20,
                    color: theme.COLORS.mainDark,
                    marginTop: 8}}
            >
                {formatShortTransactionId(txHash)}
            </Text>
        </View>
    );

    const DetailItem = ({
        leftTitle,
        rightTitle,
        rightTitleColor,
    }: {
        leftTitle: string;
        rightTitle: string;
        rightTitleColor?: string;
    }) => (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 17,
                borderBottomWidth: 1,
                borderBottomColor: "#CED6E1"}}
        >
            <Text
                style={{
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 16,
                    lineHeight: 16 * 1.6,
                    color: theme.COLORS.bodyTextColor,
                    flex: 1,
                    marginRight: 12}}
            >
                {leftTitle}
            </Text>
            <Text
                style={{
                    ...theme.FONTS.H6,
                    color: rightTitleColor ?? theme.COLORS.mainDark,
                    textAlign: "right",
                    flexShrink: 1}}
            >
                {rightTitle}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <SafeAreaView style={{ flex: 1 }}>
                <components.Header goBack={true} />
                <components.ScreenScroll
                    withTabBarInset={false}
                    contentContainerStyle={{ paddingBottom: tabBarInset }}
                >
                    <components.MerchantContent>
                        <TransactionDetailAvatar
                            counterparty={headerCounterparty}
                            isSend={isSend}
                        />
                        <Text
                            style={{
                                textAlign: "center",
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 12,
                                color: theme.COLORS.bodyTextColor,
                                marginBottom: 10}}
                        >
                            {dateStr}
                        </Text>
                        <Text
                            style={{
                                textAlign: "center",
                                ...theme.FONTS.Mulish_700Bold,
                                fontSize: 28,
                                lineHeight: 28 * 1.1,
                                color: theme.COLORS.mainDark,
                                marginBottom: 10}}
                        >
                            {isSend ? "−" : "+"} {formattedAmount} {deposit.currency}
                        </Text>
                        <Text
                            style={{
                                textAlign: "center",
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 16,
                                color: theme.COLORS.bodyTextColor,
                                marginBottom: 9}}
                        >
                            {isSend
                                ? `${t.payment.walletSend} · ${deposit.currency}`
                                : `${t.payment.walletReceive} · ${deposit.currency}`}
                        </Text>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingBottom: 30,
                                borderBottomWidth: 1,
                                borderBottomColor: "#CED6E1"}}
                        >
                            <Text
                                style={{
                                    ...theme.FONTS.Mulish_600SemiBold,
                                    fontSize: 14,
                                    lineHeight: 14 * 1.3,
                                    color: isSend ? theme.COLORS.mainDark : theme.COLORS.green}}
                            >
                                {isSend ? t.payment.sentOnChain : t.payment.depositReceived}
                            </Text>
                        </View>
                        <View style={{ marginBottom: 24 }}>
                            <DetailItem leftTitle={t.network.field} rightTitle={networkLabel} />
                            <DetailItem
                                leftTitle={t.transaction.amount}
                                rightTitle={`${
                                    deposit.currency === "USDT"
                                        ? formatUsdtAmount(deposit.amount, dateLocale)
                                        : formatNativeAmount(deposit.amount, dateLocale)
                                } ${deposit.currency}`}
                                rightTitleColor={isSend ? theme.COLORS.red : theme.COLORS.green}
                            />
                            <CounterpartyDetail
                                leftTitle={t.transaction.from}
                                label={fromLabel}
                                address={deposit.fromAddress}
                                allowAddressBook
                                savedEntry={savedFromEntry}
                            />
                            <CounterpartyDetail
                                leftTitle={t.transaction.to}
                                label={toLabel}
                                address={deposit.toAddress}
                            />
                            {deposit.txHash ? (
                                <TransactionIdDetail txHash={deposit.txHash} />
                            ) : (
                                <DetailItem
                                    leftTitle={t.transaction.txHash}
                                    rightTitle={t.payment.depositSyncedFromChain}
                                />
                            )}
                        </View>
                        {deposit.txHash && getTxExplorerUrl(deposit.network, deposit.txHash) && (
                            <components.Button
                                title={t.transaction.checkOnExplorer}
                                onPress={openExplorer}
                                containerStyle={{ marginBottom: 12 }}
                            />
                        )}
                        <components.Button
                            title={t.common.back}
                            onPress={() => navigateUp(navigation, "WalletDepositDetails")}
                            containerStyle={{ marginBottom: 20 }}
                        />
                    </components.MerchantContent>
                </components.ScreenScroll>
            </SafeAreaView>

            <AddressBookFormModal
                visible={modalVisible}
                mode={modalMode}
                title={
                    modalMode === "edit" ? t.addressBook.editContact : t.addressBook.savePromptTitle
                }
                description={modalMode === "create" ? t.addressBook.savePromptMessage : undefined}
                initialValues={formValues}
                addressReadOnly
                saving={savingContact}
                onClose={closeModal}
                onSubmit={handleSubmitContact}
            />
        </View>
    );
};

export default WalletDepositDetails;
