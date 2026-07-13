import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import React, { useMemo, useState, useCallback } from "react";
import { useDispatch } from "react-redux";

import { components } from "../components";
import AuthLabeledField from "../components/AuthLabeledField";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { setWalletMerchantContext } from "../services/wallet/walletStorage";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../hooks/useTheme";
import { createAuthFormStyles } from "../styles/authFormStyles";
import { appAlert } from "../utils/appAlert";

const buildDisplayName = (firstName: string, lastName: string) =>
    `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ").trim();

const SignUp: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { colors, FONTS } = useTheme();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const authStyles = useMemo(() => createAuthFormStyles(colors, FONTS), [colors, FONTS]);

    const header = useMemo(() => <components.Header goBack={true} />, []);

    const handleSignUp = useCallback(async () => {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedEmail = email.trim();
        const trimmedPhone = phone.trim();

        if (!trimmedFirst || !trimmedLast || !trimmedEmail || !password) {
            appAlert.alert(t.common.error, t.auth.fillAllFields);
            return;
        }
        if (password.length < 8) {
            appAlert.alert(t.common.error, t.auth.passwordMinLength);
            return;
        }

        setLoading(true);
        try {
            const res = await api.register({
                email: trimmedEmail,
                password,
                businessName: buildDisplayName(trimmedFirst, trimmedLast),
                phone: trimmedPhone || undefined,
            });
            await setWalletMerchantContext(res.data.merchant.id);
            dispatch(
                setCredentials({
                    merchant: res.data.merchant,
                    accessToken: res.data.accessToken,
                })
            );
            navigation.navigate("SignUpAccountCreated");
        } catch (err: any) {
            appAlert.alert(t.auth.registrationFailed, err.message || t.auth.registrationFailed);
        } finally {
            setLoading(false);
        }
    }, [dispatch, email, firstName, lastName, navigation, password, phone, t]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                nameRow: {
                    flexDirection: "row",
                    gap: 10,
                },
                nameCol: {
                    flex: 1,
                    minWidth: 0,
                },
                hint: {
                    ...FONTS.Mulish_400Regular,
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors.bodyTextColor,
                    marginTop: -8,
                    marginBottom: 16,
                },
            }),
        [colors, FONTS]
    );

    return (
        <components.AuthScreenLayout header={header}>
            <components.AuthFormHeader
                title={t.auth.createAccountTitle}
                subtitle={t.auth.createAccountSubtitle}
            />

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
                label={t.auth.emailLabel}
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <AuthLabeledField
                label={t.auth.phoneLabel}
                placeholder={t.auth.phonePlaceholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />
            <AuthLabeledField
                label={t.auth.passwordLabel}
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                fieldStyle={{ marginBottom: 6 }}
            />
            <Text style={styles.hint}>{t.auth.passwordRulesPlaceholder}</Text>

            <components.Button
                title={t.auth.signUp}
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                containerStyle={authStyles.buttonGap}
            />

            <components.AuthFormFooter>
                <Text style={authStyles.mutedText}>{t.auth.alreadyHaveAccount} </Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                    <Text style={authStyles.linkText}>{t.auth.signIn}</Text>
                </TouchableOpacity>
            </components.AuthFormFooter>
        </components.AuthScreenLayout>
    );
};

export default SignUp;
