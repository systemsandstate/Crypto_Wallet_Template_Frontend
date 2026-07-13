import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Keyboard,
    Platform,
} from "react-native";
import React, { useState, useCallback, memo, useRef, useMemo } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";

import { components } from "../components";
import AuthLabeledField from "../components/AuthLabeledField";
import { useTheme } from "../hooks/useTheme";
import { createAuthFormStyles } from "../styles/authFormStyles";
import { api, clearApiCache, persistAuthToken, setAuthToken } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { safeReset } from "../utils/safeNavigation";
import { appAlert } from "../utils/appAlert";
import { syncPushTokenWithBackend } from "../services/pushNotifications";
import { setWalletMerchantContext } from "../services/wallet/walletStorage";
import { syncDeviceWalletInBackground } from "../services/wallet/syncDeviceWallet";
import type { InputFieldHandle } from "../components/InputField";
import type { getDictionary } from "../i18n";

type TranslationDict = ReturnType<typeof getDictionary>;

type Props = {
    t: TranslationDict;
    navigation: NativeStackNavigationProp<any>;
};

const readInputValue = (ref: React.RefObject<InputFieldHandle | null>, fallback: string): string => {
    const node = ref.current;
    if (node && typeof node.getValue === "function") {
        return node.getValue();
    }
    const domNode = node as unknown as { value?: string } | null;
    if (domNode && typeof domNode.value === "string" && domNode.value.length > 0) {
        return domNode.value;
    }
    return fallback;
};

const waitForInputSync = (): Promise<void> =>
    new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

const SignInForm = memo(function SignInForm({ t, navigation }: Props) {
    const dispatch = useDispatch();
    const { colors, FONTS } = useTheme();
    const emailValueRef = useRef("");
    const passwordValueRef = useRef("");
    const emailInputRef = useRef<InputFieldHandle | null>(null);
    const passwordInputRef = useRef<InputFieldHandle | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const authStyles = useMemo(() => createAuthFormStyles(colors, FONTS), [colors, FONTS]);

    const onEmailChange = useCallback((text: string) => {
        emailValueRef.current = text;
        setEmail(text);
    }, []);

    const onPasswordChange = useCallback((text: string) => {
        passwordValueRef.current = text;
        setPassword(text);
    }, []);

    const handleSignIn = useCallback(() => {
        if (loading) return;

        Keyboard.dismiss();
        setLoading(true);

        void (async () => {
            emailInputRef.current?.blur();
            passwordInputRef.current?.blur();
            await waitForInputSync();

            const trimmedEmail = readInputValue(emailInputRef, emailValueRef.current || email)
                .trim()
                .toLowerCase();
            const pwd = readInputValue(passwordInputRef, passwordValueRef.current || password);

            if (!trimmedEmail || !pwd) {
                appAlert.alert(t.common.error, t.auth.enterEmailPassword);
                setLoading(false);
                return;
            }

            try {
                setAuthToken(null);
                const res = await api.login({ email: trimmedEmail, password: pwd });
                await persistAuthToken(res.data.accessToken);
                clearApiCache();
                await setWalletMerchantContext(res.data.merchant.id);
                dispatch(
                    setCredentials({
                        merchant: res.data.merchant,
                        accessToken: res.data.accessToken,
                    })
                );
                safeReset([{ name: "TabNavigator" }]);
                syncDeviceWalletInBackground({ force: true });
                void syncPushTokenWithBackend();
            } catch (err: any) {
                appAlert.alert(t.auth.signInFailed, err.message || t.auth.invalidCredentials);
                setLoading(false);
            }
        })();
    }, [dispatch, email, loading, password, t]);

    return (
        <>
            <components.AuthFormHeader subtitle={t.auth.appSubtitle} />

            <AuthLabeledField
                label={t.auth.emailLabel}
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChangeText={onEmailChange}
                inputRef={emailInputRef}
                keyboardType="email-address"
                autoCapitalize="none"
                authRole="email"
                syncImmediately={Platform.OS !== "web"}
                singleLine
            />
            <AuthLabeledField
                label={t.auth.passwordLabel}
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChangeText={onPasswordChange}
                inputRef={passwordInputRef}
                secureTextEntry
                authRole="password"
                syncImmediately={Platform.OS !== "web"}
                singleLine
                fieldStyle={{ marginBottom: 16 }}
            />

            <View style={authStyles.row}>
                <TouchableOpacity
                    style={authStyles.rememberRow}
                    onPress={() => setRememberMe((prev) => !prev)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                >
                    <View style={[authStyles.checkbox, rememberMe && authStyles.checkboxChecked]}>
                        {rememberMe ? <Text style={authStyles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={authStyles.rememberText}>{t.auth.rememberMe}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                    <Text style={authStyles.linkText}>{t.auth.forgotPassword}</Text>
                </TouchableOpacity>
            </View>

            <components.Button
                title={t.auth.signIn}
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                containerStyle={authStyles.buttonGap}
            />

            <components.AuthFormFooter>
                <Text style={authStyles.mutedText}>{t.auth.noAccount} </Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                    <Text style={authStyles.linkText}>{t.auth.registerNow}</Text>
                </TouchableOpacity>
            </components.AuthFormFooter>
        </>
    );
});

export default SignInForm;
