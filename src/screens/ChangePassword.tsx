import { Text, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { useTabBarInset } from "../hooks/useTabBarInset";

const ChangePassword: React.FC = ({ navigation }: any) => {
    const tabBarInset = useTabBarInset();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await api.changePassword({ currentPassword, newPassword });
            Alert.alert("Success", "Password updated", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Could not change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title="Change password" goBack={true} />}
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
                Update your account password
            </Text>
            <components.InputField
                placeholder="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                containerStyle={{ marginBottom: 20 }}
            />
            {loading ? (
                <ActivityIndicator color={theme.COLORS.mainDark} />
            ) : (
                <components.Button title="Update password" onPress={handleSubmit} />
            )}
        </components.AuthScreenLayout>
    );
};

export default ChangePassword;
