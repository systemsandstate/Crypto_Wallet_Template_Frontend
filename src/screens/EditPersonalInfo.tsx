import { Text, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { RootState } from "../store/store";
import { TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";

const EditPersonalInfo: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const [businessName, setBusinessName] = useState(merchant?.businessName || "");
    const [phone, setPhone] = useState(merchant?.phone || "");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!businessName.trim()) {
            Alert.alert("Error", "Business name is required");
            return;
        }
        setLoading(true);
        try {
            const res = await api.updateProfile({
                businessName: businessName.trim(),
                phone: phone.trim() || null,
            });
            const { getAuthToken } = await import("../services/api");
            const token = getAuthToken();
            if (token) {
                dispatch(setCredentials({ merchant: res.data, accessToken: token }));
            }
            Alert.alert("Saved", "Profile updated", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Could not save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title="Business info" goBack={true} />}
            cardStyle={{ marginBottom: TAB_BAR_HEIGHT }}
        >
            <components.InputField
                placeholder="Business name"
                value={businessName}
                onChangeText={setBusinessName}
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                containerStyle={{ marginBottom: 14 }}
            />
            <Text style={{ fontSize: 12, color: theme.COLORS.bodyTextColor, marginBottom: 20 }}>
                Email: {merchant?.email} (cannot be changed here)
            </Text>
            {loading ? (
                <ActivityIndicator color={theme.COLORS.mainDark} />
            ) : (
                <components.Button title="Save" onPress={handleSave} />
            )}
        </components.AuthScreenLayout>
    );
};

export default EditPersonalInfo;
