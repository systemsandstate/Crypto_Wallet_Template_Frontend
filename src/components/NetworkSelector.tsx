import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React from "react";

import { theme } from "../constants";
import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { getLocalizedNetworkLabel } from "../i18n/network";
import { useTranslation } from "../hooks/useTranslation";
import NetworkLogo from "./NetworkLogo";

type Props = {
    value: UsdtNetwork;
    onChange: (network: UsdtNetwork) => void;
};

const NetworkSelector: React.FC<Props> = ({ value, onChange }) => {
    const { t } = useTranslation();

    return (
        <View style={{ marginBottom: 20 }}>
            <Text
                style={{
                    ...theme.FONTS.Mulish_600SemiBold,
                    fontSize: 13,
                    color: theme.COLORS.mainDark,
                    marginBottom: 10,
                }}
            >
                {t.network.usdtNetwork}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                {USDT_NETWORKS.map((network) => {
                    const selected = value === network;
                    return (
                        <TouchableOpacity
                            key={network}
                            onPress={() => onChange(network)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                marginRight: 8,
                                minWidth: 108,
                                backgroundColor: selected ? theme.COLORS.mainDark : theme.COLORS.white,
                                borderWidth: selected ? 0 : 1,
                                borderColor: "#E8ECF0",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <NetworkLogo network={network} size={18} />
                                <Text
                                    style={{
                                        ...theme.FONTS.Mulish_600SemiBold,
                                        fontSize: 13,
                                        color: selected ? theme.COLORS.white : theme.COLORS.mainDark,
                                    }}
                                >
                                    {network}
                                </Text>
                            </View>
                            <Text
                                style={{
                                    ...theme.FONTS.Mulish_400Regular,
                                    fontSize: 11,
                                    marginTop: 2,
                                    color: selected ? "#CED6E1" : theme.COLORS.bodyTextColor,
                                }}
                            >
                                {getLocalizedNetworkLabel(network, t)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default NetworkSelector;
