import { Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { theme } from "../constants";
import { components } from "../components";
import { svg } from "../svg";
import { api } from "../services/api";

const NewPassword: React.FC = ({ navigation, route }: any) => {
    const resetToken: string = route.params?.resetToken || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!resetToken) {
            Alert.alert("Error", "Invalid reset link. Please request a new one.");
            return;
        }
        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters");
            return;
        }
        if (password !== confirm) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await api.resetPassword({ token: resetToken, newPassword: password });
            navigation.navigate("ForgotPasswordSentEmail", { mode: "success" });
        } catch (err: any) {
            Alert.alert("Error", err.message || "Could not reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title="New password" goBack={true} />}
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
                    Choose a new password
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
                    Enter new password and confirm.
                </Text>
                <components.InputField
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    containerStyle={{ marginBottom: 10 }}
                    icon={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <svg.EyeOffSvg />
                        </TouchableOpacity>
                    }
                />
                <components.InputField
                    placeholder="••••••••"
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showPassword}
                    containerStyle={{ marginBottom: 20 }}
                    icon={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <svg.EyeOffSvg />
                        </TouchableOpacity>
                    }
                />
                {loading ? (
                    <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
                ) : (
                    <components.Button title="Change Password" onPress={handleReset} />
                )}
            </KeyboardAwareScrollView>
        </components.AuthScreenLayout>
    );
};

export default NewPassword;
