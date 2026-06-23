import { Text, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { useTranslation } from "../hooks/useTranslation";

const ChangePassword: React.FC = ({ navigation }: any) => {
    const { t } = useTranslation();
    const tabBarInset = useTabBarInset();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert(t.common.error, t.account.passwordsDoNotMatch);
            return;
        }
        setLoading(true);
        try {
            await api.changePassword({ currentPassword, newPassword });
            Alert.alert(t.common.success, t.account.passwordUpdated, [
                { text: t.common.ok, onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert(t.common.error, err.message || t.account.couldNotChangePassword);
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title={t.account.changePasswordTitle} goBack={true} />}
            cardStyle={{ marginBottom: tabBarInset }}
        >
            <Text
                style={{
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: theme.COLORS.bodyTextColor,
                    marginBottom: 20,
                    textAlign: "center",
                }}
            >
                {t.account.updatePasswordDescription}
            </Text>
            <components.InputField
                placeholder={t.account.currentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder={t.account.newPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder={t.account.confirmNewPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                containerStyle={{ marginBottom: 20 }}
            />
            {loading ? (
                <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
            ) : (
                <components.Button title={t.account.updatePassword} onPress={handleSubmit} />
            )}
        </components.AuthScreenLayout>
    );
};

export default ChangePassword;
