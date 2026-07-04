import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
        StyleSheet,
} from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector } from "../hooks/useAppSelector";

import { components } from "../components";
import NetworkLogo from "../components/NetworkLogo";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { RootState } from "../store/store";
import { loadAddressBook, type AddressBookEntry } from "../services/addressBookStorage";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";

type RouteParams = {
    network?: UsdtNetwork;
};

const AddressBookPicker: React.FC = ({ navigation, route }: any) => {
    const routeNetwork = (route.params as RouteParams | undefined)?.network;
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [allEntries, setAllEntries] = useState<AddressBookEntry[]>([]);
    const [selectedNetwork, setSelectedNetwork] = useState<UsdtNetwork>(routeNetwork ?? "TRC20");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!merchant?.id) {
            setAllEntries([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const items = await loadAddressBook(merchant.id);
        setAllEntries(items);
        setLoading(false);
    }, [merchant?.id]);

    useFocusEffect(
        useCallback(() => {
            if (routeNetwork) {
                setSelectedNetwork(routeNetwork);
            }
            setSelectedId(null);
            setSearch("");
            void load();
        }, [load, routeNetwork])
    );

    const entries = useMemo(
        () => allEntries.filter((entry) => entry.network === selectedNetwork),
        [allEntries, selectedNetwork]
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return entries;
        return entries.filter(
            (entry) =>
                entry.name.toLowerCase().includes(query) ||
                entry.address.toLowerCase().includes(query)
        );
    }, [entries, search]);

    const selected = entries.find((entry) => entry.id === selectedId);

    const handleConfirm = () => {
        if (!selected) return;
        navigation.navigate(
            "Withdraw",
            {
                pickedAddress: selected.address,
                pickedNetwork: selected.network,
            },
            { merge: true }
        );
    };

    const handleNetworkChange = (network: UsdtNetwork) => {
        setSelectedNetwork(network);
        setSelectedId(null);
    };

    const networkLabel = getLocalizedNetworkLabel(selectedNetwork, t);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    lineHeight: 14 * 1.6,
                    marginBottom: 14,
                    textAlign: "center",
                },
                card: {
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 2,
                    borderColor: "transparent",
                },
                cardHeader: {
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                },
                cardSelected: {
                    borderColor: colors.linkColor,
                    backgroundColor: colors.surfaceMuted,
                },
                meta: {
                    flex: 1,
                    marginLeft: 12,
                    minWidth: 0,
                },
                name: {
                    ...FONTS.H6,
                    color: colors.mainDark,
                    marginBottom: 4,
                },
                network: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 12,
                    color: colors.linkColor,
                },
                address: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                    lineHeight: 18,
                },
                addressScroll: {
                    flexGrow: 0,
                },
                empty: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    lineHeight: 14 * 1.6,
                    paddingHorizontal: 12,
                },
                emptyWrap: {
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 160,
                    paddingHorizontal: 12,
                },
                footer: {
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 24,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.bgColor,
                },
            }),
        [FONTS, colors]
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.addressBook.pickTitle} goBack={true} />
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <components.MerchantContent style={{ flex: 1, paddingTop: 16 }}>
                        <components.NetworkSelector
                            value={selectedNetwork}
                            onChange={handleNetworkChange}
                        />

                        <Text style={styles.subtitle}>
                            {formatMessage(t.withdraw.addressBookForNetwork, { network: networkLabel })}
                        </Text>

                        <components.InputField
                            placeholder={t.addressBook.searchPlaceholder}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                            containerStyle={{ marginBottom: 16 }}
                        />

                        {loading ? (
                            <View style={styles.emptyWrap}>
                                <LoadingSpinner size={40} />
                            </View>
                        ) : filtered.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.empty}>
                                    {entries.length === 0
                                        ? t.withdraw.addressBookEmptyForNetwork
                                        : t.addressBook.noSearchResults}
                                </Text>
                            </View>
                        ) : (
                            filtered.map((entry) => {
                                const isSelected = entry.id === selectedId;
                                return (
                                    <TouchableOpacity
                                        key={entry.id}
                                        style={[styles.card, isSelected && styles.cardSelected]}
                                        activeOpacity={0.75}
                                        onPress={() => setSelectedId(entry.id)}
                                    >
                                        <View style={styles.cardHeader}>
                                            <NetworkLogo network={entry.network} size={36} />
                                            <View style={styles.meta}>
                                                <Text style={styles.name}>{entry.name}</Text>
                                                <Text style={styles.network}>
                                                    {getLocalizedNetworkLabel(entry.network, t)} ({entry.network})
                                                </Text>
                                            </View>
                                        </View>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.addressScroll}
                                            contentContainerStyle={{ paddingRight: 4 }}
                                        >
                                            <Text style={styles.address} selectable>
                                                {entry.address}
                                            </Text>
                                        </ScrollView>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </components.MerchantContent>
                </ScrollView>

                <View style={styles.footer}>
                    <components.Button
                        title={t.addressBook.confirmSelection}
                        onPress={handleConfirm}
                        disabled={!selected}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AddressBookPicker;
