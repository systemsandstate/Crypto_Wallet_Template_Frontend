import { Text, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { RootState } from "../store/store";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { useTranslation } from "../hooks/useTranslation";
import { formatMessage } from "../i18n";

const EditPersonalInfo: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const tabBarInset = useTabBarInset();
    const merchant = useSelector((state: RootState) => state.auth.merchant);
    const [businessName, setBusinessName] = useState(merchant?.businessName || "");
    const [phone, setPhone] = useState(merchant?.phone || "");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!businessName.trim()) {
            Alert.alert(t.common.error, t.account.businessNameRequired);
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
            Alert.alert(t.account.saved, t.account.profileUpdated, [
                { text: t.common.ok, onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert(t.common.error, err.message || t.account.couldNotSave);
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title={t.account.businessInfo} goBack={true} />}
            cardStyle={{ marginBottom: tabBarInset }}
        >
            <components.InputField
                placeholder={t.auth.businessNamePlaceholder}
                value={businessName}
                onChangeText={setBusinessName}
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder={t.account.phoneOptional}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                containerStyle={{ marginBottom: 14 }}
            />
            {merchant?.email ? (
                <Text
                    style={{
                        ...theme.FONTS.Mulish_400Regular,
                        fontSize: 13,
                        color: theme.COLORS.bodyTextColor,
                        marginBottom: 16,
                        textAlign: "center",
                    }}
                >
                    {formatMessage(t.account.emailReadOnly, { email: merchant.email })}
                </Text>
            ) : null}
            {loading ? (
                <ActivityIndicator size="large" color={theme.COLORS.mainDark} />
            ) : (
                <components.Button title={t.common.save} onPress={handleSave} />
            )}
        </components.AuthScreenLayout>
    );
};

export default EditPersonalInfo;
