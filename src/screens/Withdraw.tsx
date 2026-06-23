import { Text, View, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { theme } from "../constants";
import { UsdtNetwork } from "../constants/usdtNetworks";
import { useTranslation } from "../hooks/useTranslation";
import { formatMessage } from "../i18n";

const Withdraw: React.FC = () => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [network, setNetwork] = useState<UsdtNetwork>("TRC20");

    const handleSubmit = () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) {
            Alert.alert(t.common.error, t.payment.invalidAmount);
            return;
        }
        if (!address.trim()) {
            Alert.alert(t.common.error, t.withdraw.enterWalletAddress);
            return;
        }
        Alert.alert(
            t.withdraw.withdrawalRequest,
            formatMessage(t.withdraw.withdrawalMessage, {
                amount: String(num),
                network,
                address: address.trim(),
            })
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title={t.withdraw.title} goBack={true} />
                <components.FormScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <components.MerchantContent style={{ paddingVertical: 16 }}>
                        <Text
                            style={{
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 14,
                                color: theme.COLORS.bodyTextColor,
                                marginVertical: 16,
                                lineHeight: 14 * 1.6,
                            }}
                        >
                            {t.withdraw.description}
                        </Text>
                        <components.NetworkSelector value={network} onChange={setNetwork} />
                        <components.InputField
                            placeholder={t.payment.amountPlaceholder}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            containerStyle={{ marginBottom: 14 }}
                        />
                        <components.InputField
                            placeholder={t.payment.walletAddressPlaceholder}
                            value={address}
                            onChangeText={setAddress}
                            containerStyle={{ marginBottom: 20 }}
                        />
                        <components.Button title={t.withdraw.requestWithdrawal} onPress={handleSubmit} />
                    </components.MerchantContent>
                </components.FormScrollView>
            </SafeAreaView>
        </View>
    );
};

export default Withdraw;
