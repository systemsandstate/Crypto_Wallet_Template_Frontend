import { View, TouchableOpacity, Text, ActivityIndicator, Alert } from "react-native";
import React, { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useDispatch } from "react-redux";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";

const SignUp: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const [businessName, setBusinessName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!businessName || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters with a number and uppercase letter");
            return;
        }
        setLoading(true);
        try {
            const res = await api.register({
                email: email.trim(),
                password,
                businessName: businessName.trim(),
            });
            dispatch(setCredentials({
                merchant: res.data.merchant,
                accessToken: res.data.accessToken,
            }));
            navigation.navigate("SignUpAccountCreated");
        } catch (err: any) {
            Alert.alert("Registration failed", err.message || "Could not create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title="Sign up" goBack={true} />}
        >
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text
                    style={{
                        textAlign: "center",
                        ...theme.FONTS.H2,
                        color: theme.COLORS.mainDark,
                        marginBottom: 8,
                    }}
                >
                    Create account
                </Text>
                <Text
                    style={{
                        textAlign: "center",
                        ...theme.FONTS.Mulish_400Regular,
                        fontSize: 14,
                        color: theme.COLORS.bodyTextColor,
                        marginBottom: 24,
                        lineHeight: 14 * 1.6,
                    }}
                >
                    Start accepting USDT payments for your business
                </Text>
                <components.InputField
                    placeholder="Business name"
                    value={businessName}
                    onChangeText={setBusinessName}
                    containerStyle={{ marginBottom: 14 }}
                />
                <components.InputField
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    containerStyle={{ marginBottom: 14 }}
                />
                <components.InputField
                    placeholder="Password (8+ chars, 1 uppercase, 1 number)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    containerStyle={{ marginBottom: 20 }}
                />
                {loading ? (
                    <ActivityIndicator size="large" color={theme.COLORS.mainDark} style={{ marginBottom: 20 }} />
                ) : (
                    <components.Button
                        title="Sign up"
                        onPress={handleSignUp}
                        containerStyle={{ marginBottom: 20 }}
                    />
                )}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.bodyTextColor, fontSize: 16 }}>
                        Already have an account?{" "}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                        <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.linkColor, fontSize: 16 }}>
                            Sign in
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </components.AuthScreenLayout>
    );
};

export default SignUp;
