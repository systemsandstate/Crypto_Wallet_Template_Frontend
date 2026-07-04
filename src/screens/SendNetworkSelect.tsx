import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
} from "react-native";
import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { getLocalizedNetworkLabel } from "../i18n/network";

export type NetworkFilter = "ALL" | UsdtNetwork;

type RouteParams = {
    filter?: NetworkFilter;
    returnScreen?: "SendSelect" | "ReceiveSelect";
};

type Props = {
    navigation: any;
    route: { params?: RouteParams };
};

const RadioMark: React.FC<{ selected: boolean; colors: ReturnType<typeof useTheme>["colors"] }> = ({
    selected,
    colors,
}) => (
    <View
        style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? colors.accentBlue : colors.border,
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        {selected ? (
            <View
                style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.accentBlue,
                }}
            />
        ) : null}
    </View>
);

const GlobeIcon: React.FC<{ borderColor: string }> = ({ borderColor }) => (
    <View
        style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F0F2F5",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor,
        }}
    >
        <Text style={{ fontSize: 20, opacity: 0.55 }}>🌐</Text>
    </View>
);

const SendNetworkSelect: React.FC<Props> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const initialFilter = route.params?.filter ?? "ALL";
    const returnScreen = route.params?.returnScreen ?? "SendSelect";
    const [search, setSearch] = useState("");

    const filteredNetworks = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return USDT_NETWORKS;
        return USDT_NETWORKS.filter((network) => {
            const label = getLocalizedNetworkLabel(network, t).toLowerCase();
            return label.includes(query) || network.toLowerCase().includes(query);
        });
    }, [search, t]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                searchWrap: {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 24,
                    paddingHorizontal: 14,
                    marginBottom: 20,
                    minHeight: 44,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                searchIcon: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                    color: colors.bodyTextColor,
                    marginRight: 8,
                },
                searchInput: {
                    flex: 1,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 15,
                    color: colors.mainDark,
                    paddingVertical: 10,
                    ...(Platform.OS === "web"
                        ? ({ outlineStyle: "none", outlineWidth: 0 } as object)
                        : {}),
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                },
                rowLabel: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 16,
                    color: colors.mainDark,
                    flex: 1,
                    marginLeft: 12,
                },
                sectionTitle: {
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginTop: 8,
                    marginBottom: 4,
                },
                logoWrap: {
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
            }),
        [FONTS, colors]
    );

    const applyFilter = (filter: NetworkFilter) => {
        navigation.navigate({
            name: returnScreen,
            params: { networkFilter: filter },
            merge: true,
        });
    };

    const screenTitle =
        returnScreen === "ReceiveSelect"
            ? t.wallet.selectReceiveNetwork
            : t.withdraw.selectNetwork;

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={screenTitle} goBack={true} />
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.searchWrap}>
                        <Text style={styles.searchIcon}>⌕</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t.withdraw.searchForNetwork}
                            placeholderTextColor={colors.placeholder}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => applyFilter("ALL")}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: initialFilter === "ALL" }}
                    >
                        <GlobeIcon borderColor={colors.border} />
                        <Text style={styles.rowLabel}>{t.withdraw.allNetworksLabel}</Text>
                        <RadioMark selected={initialFilter === "ALL"} colors={colors} />
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>{t.withdraw.popularNetworks}</Text>

                    {filteredNetworks.map((network) => (
                        <TouchableOpacity
                            key={network}
                            style={styles.row}
                            onPress={() => applyFilter(network)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: initialFilter === network }}
                        >
                            <View style={styles.logoWrap}>
                                <components.NetworkLogo network={network} size={28} />
                            </View>
                            <Text style={styles.rowLabel}>{getLocalizedNetworkLabel(network, t)}</Text>
                            <RadioMark selected={initialFilter === network} colors={colors} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default SendNetworkSelect;
