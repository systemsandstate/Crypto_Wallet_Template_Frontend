import { View, TouchableOpacity, Text} from "react-native";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { theme } from "../constants";
import { components } from "../components";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { useTranslation } from "../hooks/useTranslation";
import { appAlert } from '../utils/appAlert';

const SignUp: React.FC = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [businessName, setBusinessName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const header = useMemo(
        () => <components.Header title={t.auth.signUp} goBack={true} />,
        [t.auth.signUp]
    );

    const handleSignUp = async () => {
        if (!businessName || !email || !password) {
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
                email: email.trim(),
                password,
                businessName: businessName.trim()});
            dispatch(setCredentials({
                merchant: res.data.merchant,
                accessToken: res.data.accessToken}));
            navigation.navigate("SignUpAccountCreated");
        } catch (err: any) {
            appAlert.alert(t.auth.registrationFailed, err.message || t.auth.registrationFailed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <components.AuthScreenLayout header={header}>
            <Text
                style={{
                    textAlign: "center",
                    ...theme.FONTS.H2,
                    color: theme.COLORS.mainDark,
                    marginBottom: 8}}
            >
                {t.auth.createAccountTitle}
            </Text>
            <Text
                style={{
                    textAlign: "center",
                    ...theme.FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: theme.COLORS.bodyTextColor,
                    marginBottom: 24,
                    lineHeight: 14 * 1.6}}
            >
                {t.auth.createAccountSubtitle}
            </Text>
            <components.InputField
                placeholder={t.auth.businessNamePlaceholder}
                value={businessName}
                onChangeText={setBusinessName}
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={{ marginBottom: 14 }}
            />
            <components.InputField
                placeholder={t.auth.passwordPlaceholder}
                hint={t.auth.passwordRulesPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                containerStyle={{ marginBottom: 20 }}
            />
            <components.Button
                title={t.auth.signUp}
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                containerStyle={{ marginBottom: 20 }}
            />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.bodyTextColor, fontSize: 16 }}>
                    {t.auth.alreadyHaveAccount}{" "}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                    <Text style={{ ...theme.FONTS.Mulish_400Regular, color: theme.COLORS.linkColor, fontSize: 16 }}>
                        {t.auth.signIn}
                    </Text>
                </TouchableOpacity>
            </View>
        </components.AuthScreenLayout>
    );
};

export default SignUp;
