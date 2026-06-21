import { Text, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { theme } from "../constants";
import { components } from "../components";
import { svg } from "../svg";
import { api } from "../services/api";

const ForgotPassword: React.FC = ({ navigation }: any) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email address");
            return;
        }
        setLoading(true);
        try {
            await api.forgotPassword({ email: email.trim() });
            navigation.navigate("ForgotPasswordSentEmail", { mode: "email_sent" });
        } catch (err: any) {
            Alert.alert("Error", err.message || "Could not send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title="Forgot Password" goBack={true} />}
        >
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
                <Text
                    style={{
                        ...theme.FONTS.H3,
                        color: theme.COLORS.mainDark,
                        marginBottom: 12,
                        textAlign: "center",
                    }}
                >
                    Reset password
                </Text>
                <Text
                    style={{
                        ...theme.FONTS.Mulish_400Regular,
                        fontSize: 16,
                        color: theme.COLORS.bodyTextColor,
                        lineHeight: 16 * 1.7,
                        marginBottom: 24,
                        textAlign: "center",
                    }}
                >
                    Enter your email address. You will receive a link to create a new password via email.
                </Text>
                <components.InputField
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    containerStyle={{ marginBottom: 20 }}
                    rightIcon={<svg.CheckSvg />}
                />
                {loading ? (
                    <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
                ) : (
                    <components.Button title="Send" onPress={handleSend} />
                )}
            </KeyboardAwareScrollView>
        </components.AuthScreenLayout>
    );
};

export default ForgotPassword;
