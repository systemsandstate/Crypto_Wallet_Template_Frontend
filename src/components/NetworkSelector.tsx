import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React from "react";

import { USDT_NETWORKS, UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import NetworkLogo from "./NetworkLogo";

type Props = {
    value: UsdtNetwork;
    onChange: (network: UsdtNetwork) => void;
};

const NetworkSelector: React.FC<Props> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();

    return (
        <View style={{ marginBottom: 12 }}>
            <Text
                style={{
                    ...FONTS.Mulish_600SemiBold,
                    fontSize: 11,
                    color: colors.mainDark,
                    marginBottom: 6,
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
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 8,
                                marginRight: 6,
                                minWidth: 68,
                                backgroundColor: selected ? colors.headerBg : colors.white,
                                borderWidth: selected ? 0 : 1,
                                borderColor: colors.inputBorder,
                            }}
                        >
                            <NetworkLogo network={network} size={12} />
                            <Text
                                style={{
                                    ...FONTS.Mulish_600SemiBold,
                                    fontSize: 10,
                                    color: selected ? "#FFFFFF" : colors.mainDark,
                                    textAlign: "center",
                                }}
                            >
                                {network}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default NetworkSelector;
