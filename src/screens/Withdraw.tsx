import { Text, View, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { components } from "../components";
import { theme } from "../constants";
import { UsdtNetwork } from "../constants/usdtNetworks";

const Withdraw: React.FC = () => {
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [network, setNetwork] = useState<UsdtNetwork>("TRC20");

    const handleSubmit = () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) {
            Alert.alert("Error", "Enter a valid amount");
            return;
        }
        if (!address.trim()) {
            Alert.alert("Error", "Enter a wallet address");
            return;
        }
        Alert.alert(
            "Withdrawal request",
            `USDT withdrawals will be processed via OxaPay once payout is enabled for your merchant account.\n\nAmount: ${num} USDT\nNetwork: ${network}\nAddress: ${address.trim()}`
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.COLORS.bgColor }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <components.Header title="Withdraw USDT" goBack={true} />
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
                        Send USDT from your received balance to an external wallet address.
                    </Text>
                    <components.NetworkSelector value={network} onChange={setNetwork} />
                    <components.InputField
                        placeholder="Amount (USDT)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        containerStyle={{ marginBottom: 14 }}
                    />
                    <components.InputField
                        placeholder="Wallet address"
                        value={address}
                        onChangeText={setAddress}
                        containerStyle={{ marginBottom: 20 }}
                    />
                    <components.Button title="Request withdrawal" onPress={handleSubmit} />
                    </components.MerchantContent>
                </components.FormScrollView>
            </SafeAreaView>
        </View>
    );
};

export default Withdraw;
