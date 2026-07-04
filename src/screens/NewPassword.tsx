import { Text, TouchableOpacity, Alert } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useState } from "react";

import { theme } from "../constants";
import { components } from "../components";
import { svg } from "../svg";
import { api } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";

const NewPassword: React.FC = ({ navigation, route }: any) => {
    const { t } = useTranslation();
    const resetToken: string = route.params?.resetToken || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!resetToken) {
            Alert.alert(t.common.error, t.auth.invalidResetLink);
            return;
        }
        if (password.length < 8) {
            Alert.alert(t.common.error, t.auth.passwordMin8);
            return;
        }
        if (password !== confirm) {
            Alert.alert(t.common.error, t.auth.passwordsNotMatch);
            return;
        }
        setLoading(true);
        try {
            await api.resetPassword({ token: resetToken, newPassword: password });
            navigation.navigate("ForgotPasswordSentEmail", { mode: "success" });
        } catch (err: any) {
            Alert.alert(t.common.error, err.message || t.auth.couldNotResetPassword);
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title={t.auth.newPasswordTitle} goBack={true} />}
        >
            <Text
                style={{
                    ...theme.FONTS.H3,
                    color: theme.COLORS.mainDark,
                    marginBottom: 12,
                    textAlign: "center",
                }}
            >
                {t.auth.chooseNewPassword}
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
                {t.auth.enterNewPasswordConfirm}
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
                <LoadingSpinner size={48} />
            ) : (
                <components.Button title={t.auth.changePasswordButton} onPress={handleReset} />
            )}
        </components.AuthScreenLayout>
    );
};

export default NewPassword;
