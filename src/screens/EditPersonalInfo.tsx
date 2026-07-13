import { Text, View, StyleSheet } from "react-native";
import LoadingSpinner from "../components/LoadingSpinner";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks/useAppSelector";

import { components } from "../components";
import AuthLabeledField from "../components/AuthLabeledField";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { RootState } from "../store/store";
import { useTabBarInset } from "../hooks/useTabBarInset";
import { useTranslation } from "../hooks/useTranslation";
import { formatMessage } from "../i18n";
import { navigateUp } from "../navigation/navigateUp";
import { useTheme } from "../hooks/useTheme";
import { appAlert } from "../utils/appAlert";

const splitDisplayName = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const buildDisplayName = (firstName: string, lastName: string) =>
    `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ").trim();

const EditPersonalInfo: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const tabBarInset = useTabBarInset();
    const merchant = useAppSelector((state: RootState) => state.auth.merchant);
    const initialName = useMemo(
        () => splitDisplayName(merchant?.businessName || ""),
        [merchant?.businessName]
    );
    const [firstName, setFirstName] = useState(initialName.firstName);
    const [lastName, setLastName] = useState(initialName.lastName);
    const [phone, setPhone] = useState(merchant?.phone || "");
    const [loading, setLoading] = useState(false);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                nameRow: {
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 0,
                },
                nameCol: {
                    flex: 1,
                    minWidth: 0,
                },
                emailNote: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 13,
                    color: colors.bodyTextColor,
                    marginBottom: 16,
                    textAlign: "center",
                },
            }),
        [FONTS, colors]
    );

    const handleSave = async () => {
        const displayName = buildDisplayName(firstName, lastName);
        if (!displayName) {
            appAlert.alert(t.common.error, t.account.nameRequired);
            return;
        }
        setLoading(true);
        try {
            const res = await api.updateProfile({
                businessName: displayName,
                phone: phone.trim() || null,
            });
            const { getAuthToken } = await import("../services/api");
            const token = getAuthToken();
            if (token) {
                dispatch(setCredentials({ merchant: res.data, accessToken: token }));
            }
            appAlert.alert(t.account.saved, t.account.profileUpdated, [
                { text: t.common.ok, onPress: () => navigateUp(navigation, "EditPersonalInfo") },
            ]);
        } catch (err: any) {
            appAlert.alert(t.common.error, err.message || t.account.couldNotSave);
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout
            header={<components.Header title={t.account.personalInfo} goBack={true} />}
            cardStyle={{ marginBottom: tabBarInset }}
        >
            <View style={styles.nameRow}>
                <AuthLabeledField
                    label={t.auth.firstNameLabel}
                    placeholder={t.auth.firstNamePlaceholder}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    fieldStyle={styles.nameCol}
                />
                <AuthLabeledField
                    label={t.auth.lastNameLabel}
                    placeholder={t.auth.lastNamePlaceholder}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    fieldStyle={styles.nameCol}
                />
            </View>
            <AuthLabeledField
                label={t.auth.phoneLabel}
                placeholder={t.auth.phonePlaceholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />
            {merchant?.email ? (
                <Text style={styles.emailNote}>
                    {formatMessage(t.account.emailReadOnly, { email: merchant.email })}
                </Text>
            ) : null}
            {loading ? (
                <LoadingSpinner size={48} />
            ) : (
                <components.Button title={t.common.save} onPress={handleSave} />
            )}
        </components.AuthScreenLayout>
    );
};

export default EditPersonalInfo;
