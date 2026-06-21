import { View, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useDispatch } from "react-redux";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";

const SignIn: React.FC = ({ navigation, route }: any) => {
    const dispatch = useDispatch();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
            const message = sessionStorage.getItem("sessionExpired");
            if (message) {
                sessionStorage.removeItem("sessionExpired");
                window.alert(message);
                return;
            }
        }
        if (route.params?.sessionExpired) {
            Alert.alert("Session expired", route.params.sessionExpired);
            navigation.setParams({ sessionExpired: undefined });
        }
    }, [route.params?.sessionExpired, navigation]);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }
        setLoading(true);
        try {
            const res = await api.login({ email: email.trim(), password });
            dispatch(setCredentials({
                merchant: res.data.merchant,
                accessToken: res.data.accessToken,
            }));
            navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
        } catch (err: any) {
            Alert.alert("Sign in failed", err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title="Sign in" goBack={true} />}
        >
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text
                    style={{
                        textAlign: "center",
                        ...theme.FONTS.H1,
                        color: theme.COLORS.mainDark,
                        marginBottom: 8,
                    }}
                >
                    Merchant{"\n"}Payments
                </Text>
                <Text
                    style={{
                        textAlign: "center",
                        ...theme.FONTS.Mulish_400Regular,
                        fontSize: 14,
                        color: theme.COLORS.bodyTextColor,
                        marginBottom: 24,
                    }}
                >
                    Sign in to manage your USDT invoices
                </Text>
                <components.InputField
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    containerStyle={{ marginBottom: 14 }}
                />
                <components.InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    containerStyle={{ marginBottom: 20 }}
                />
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                    }}
                >
                    <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => setRememberMe(!rememberMe)}
                    >
                        <View
                            style={{
                                width: 16,
                                height: 16,
                                borderWidth: 1,
                                borderColor: "#868698",
                                borderRadius: 4,
                                backgroundColor: theme.COLORS.white,
                                marginRight: 10,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            {rememberMe && (
                                <View
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 2,
                                        backgroundColor: "#868698",
                                    }}
                                />
                            )}
                        </View>
                        <Text
                            style={{
                                color: theme.COLORS.bodyTextColor,
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 16,
                            }}
                        >
                            Remember me
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                        <Text
                            style={{
                                color: theme.COLORS.linkColor,
                                ...theme.FONTS.Mulish_400Regular,
                                fontSize: 16,
                            }}
                        >
                            Forgot password?
                        </Text>
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.COLORS.mainDark} style={{ marginBottom: 24 }} />
                ) : (
                    <components.Button
                        title="Sign in"
                        onPress={handleSignIn}
                        containerStyle={{ marginBottom: 24 }}
                    />
                )}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.bodyTextColor, fontSize: 16 }}>
                        No account?{" "}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                        <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.linkColor, fontSize: 16 }}>
                            Register now
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </components.AuthScreenLayout>
    );
};

export default SignIn;
