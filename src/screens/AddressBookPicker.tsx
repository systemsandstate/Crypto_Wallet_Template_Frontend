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
import { useInitialScreenLoad } from "../hooks/useInitialScreenLoad";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { useAppSelector } from "../hooks/useAppSelector";

import { components } from "../components";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { RootState } from "../store/store";
import { loadAddressBook, type AddressBookEntry } from "../services/addressBookStorage";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { formatMessage } from "../i18n";
import {
    entrySupportsNetwork,
    getAddressBookEntryAddress,
} from "../utils/addressBookNetworks";

type RouteParams = {
    network?: UsdtNetwork;
};

const avatarColor = (seed: string) => {
    const palette = ["#2563EB", "#059669", "#7C3AED", "#D97706", "#DB2777", "#0891B2"];
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
};

const AddressBookPicker: React.FC = ({ navigation, route }: any) => {
    const routeNetwork = (route.params as RouteParams | undefined)?.network;
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const tabBarInset = useTabBarInset(8);
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const [allEntries, setAllEntries] = useState<AddressBookEntry[]>([]);
    const selectedNetwork = routeNetwork ?? "BEP20";
    const [loading, setLoading] = useState(true);
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

    useInitialScreenLoad(load);

    useFocusEffect(
        useCallback(() => {
            setSelectedId(null);
        }, [routeNetwork])
    );

    const entries = useMemo(
        () =>
            routeNetwork
                ? allEntries.filter((entry) => entrySupportsNetwork(entry, selectedNetwork))
                : allEntries,
        [allEntries, routeNetwork, selectedNetwork]
    );

    const selected = entries.find((entry) => entry.id === selectedId);

    const handleConfirm = () => {
        if (!selected) return;
        const pickedSendAddress = getAddressBookEntryAddress(selected, selectedNetwork);
        if (!pickedSendAddress) return;
        // Prefer email so Withdraw can auto-route across the contact's networks.
        const displayValue = selected.email?.trim() || pickedSendAddress;
        navigation.navigate(
            "Withdraw",
            {
                pickedAddress: displayValue,
                pickedSendAddress: selected.email?.trim() ? undefined : pickedSendAddress,
                pickedContactName: selected.name,
                pickedNetwork: undefined,
                lockNetwork: false,
            },
            { merge: true }
        );
    };

    const networkLabel = getLocalizedNetworkLabel(selectedNetwork, t);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                subtitle: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    lineHeight: 18,
                    marginBottom: 14,
                },
                card: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    borderWidth: 2,
                    borderColor: "transparent",
                },
                cardSelected: {
                    borderColor: colors.accentBlue,
                    backgroundColor: colors.surfaceMuted,
                },
                avatar: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                },
                avatarText: {
                    ...FONTS.Mulish_700Bold,
                    fontSize: 15,
                    color: colors.pureWhite,
                },
                meta: {
                    flex: 1,
                    minWidth: 0,
                },
                name: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.mainDark,
                    marginBottom: 2,
                },
                email: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    color: colors.bodyTextColor,
                },
                empty: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    textAlign: "center",
                    lineHeight: 20,
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
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarInset }}
                    keyboardShouldPersistTaps="handled"
                >
                    <components.MerchantContent style={{ flex: 1, paddingTop: 16 }}>
                        <Text style={styles.subtitle}>
                            {routeNetwork
                                ? formatMessage(t.withdraw.addressBookForNetwork, {
                                      network: networkLabel,
                                  })
                                : t.withdraw.addressBookActionHint}
                        </Text>

                        {loading ? (
                            <View style={styles.emptyWrap}>
                                <LoadingSpinner size={40} />
                            </View>
                        ) : entries.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Text style={styles.empty}>{t.withdraw.addressBookEmptyForNetwork}</Text>
                            </View>
                        ) : (
                            entries.map((entry) => {
                                const isSelected = entry.id === selectedId;
                                const initial = (entry.name.trim()[0] || "?").toUpperCase();
                                const bg = avatarColor(entry.name);
                                return (
                                    <TouchableOpacity
                                        key={entry.id}
                                        style={[styles.card, isSelected && styles.cardSelected]}
                                        activeOpacity={0.75}
                                        onPress={() => setSelectedId(entry.id)}
                                    >
                                        <View style={[styles.avatar, { backgroundColor: bg }]}>
                                            <Text style={styles.avatarText}>{initial}</Text>
                                        </View>
                                        <View style={styles.meta}>
                                            <Text style={styles.name} numberOfLines={1}>
                                                {entry.name}
                                            </Text>
                                            <Text style={styles.email} numberOfLines={1}>
                                                {entry.email?.trim() || t.addressBook.noEmailOnFile}
                                            </Text>
                                        </View>
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
