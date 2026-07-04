import {
    View,
    TouchableOpacity,
    Text,
    Alert,
    StyleSheet,
    Keyboard,
    Platform,
} from "react-native";
import React, { useState, useCallback, memo, useRef, useMemo } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";

import { components } from "../components";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTheme } from "../hooks/useTheme";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { safeReset } from "../utils/safeNavigation";
import { syncPushTokenWithBackend } from "../services/pushNotifications";
import type { getDictionary } from "../i18n";

type TranslationDict = ReturnType<typeof getDictionary>;

type Props = {
    t: TranslationDict;
    navigation: NativeStackNavigationProp<any>;
};

const readInputValue = (ref: React.RefObject<any>, fallback: string): string => {
    const node = ref.current;
    if (node && typeof node.value === "string" && node.value.length > 0) {
        return node.value;
    }
    return fallback;
};

const SignInForm = memo(function SignInForm({ t, navigation }: Props) {
    const dispatch = useDispatch();
    const { isCompact } = useResponsiveLayout();
    const { colors, FONTS } = useTheme();
    const emailValueRef = useRef("");
    const passwordValueRef = useRef("");
    const emailInputRef = useRef<any>(null);
    const passwordInputRef = useRef<any>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const onEmailChange = useCallback((text: string) => {
        emailValueRef.current = text;
        setEmail(text);
    }, []);

    const onPasswordChange = useCallback((text: string) => {
        passwordValueRef.current = text;
        setPassword(text);
    }, []);

    const handleSignIn = useCallback(() => {
        // Prefer DOM/native values so browser autofill (which may skip onChange) still works.
        const trimmedEmail = readInputValue(
            emailInputRef,
            emailValueRef.current || email
        ).trim();
        const pwd = readInputValue(passwordInputRef, passwordValueRef.current || password);

        if (!trimmedEmail || !pwd) {
            Alert.alert(t.common.error, t.auth.enterEmailPassword);
            return;
        }
        if (loading) return;

        Keyboard.dismiss();
        setLoading(true);

        void (async () => {
            try {
                const res = await api.login({ email: trimmedEmail, password: pwd });
                dispatch(
                    setCredentials({
                        merchant: res.data.merchant,
                        accessToken: res.data.accessToken,
                    })
                );
                if (Platform.OS === "android") {
                    await new Promise((resolve) => setTimeout(resolve, 80));
                }
                safeReset([{ name: "TabNavigator" }]);
                void syncPushTokenWithBackend();
            } catch (err: any) {
                Alert.alert(t.auth.signInFailed, err.message || t.auth.invalidCredentials);
                setLoading(false);
            }
        })();
    }, [dispatch, email, loading, password, t]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                title: {
                    textAlign: "center",
                    ...FONTS.H1,
                    color: colors.mainDark,
                    marginBottom: 8,
                },
                titleCompact: {
                    fontSize: 32,
                    lineHeight: 38,
                },
                subtitle: {
                    textAlign: "center",
                    ...FONTS.Mulish_400Regular,
                    fontSize: 14,
                    color: colors.bodyTextColor,
                    marginBottom: 24,
                },
                fieldGap: {
                    marginBottom: 14,
                },
                fieldGapLarge: {
                    marginBottom: 20,
                },
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                },
                rememberRow: {
                    flexDirection: "row",
                    alignItems: "center",
                },
                checkbox: {
                    width: 18,
                    height: 18,
                    borderWidth: 1.5,
                    borderColor: colors.placeholder,
                    borderRadius: 4,
                    backgroundColor: colors.surfaceMuted,
                    marginRight: 10,
                    justifyContent: "center",
                    alignItems: "center",
                },
                checkboxInner: {
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: colors.accentBlue,
                },
                rememberText: {
                    color: colors.bodyTextColor,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                },
                linkText: {
                    color: colors.linkColor,
                    ...FONTS.Mulish_400Regular,
                    fontSize: 16,
                },
                buttonGap: {
                    marginBottom: 24,
                },
                footerRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                },
                footerText: {
                    ...FONTS.Mulish_400Regular,
                    color: colors.bodyTextColor,
                    fontSize: 16,
                },
            }),
        [colors, FONTS]
    );

    return (
        <>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>{t.auth.appTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.appSubtitle}</Text>
            <components.InputField
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChangeText={onEmailChange}
                inputRef={emailInputRef}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.fieldGap}
            />
            <components.InputField
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChangeText={onPasswordChange}
                inputRef={passwordInputRef}
                secureTextEntry={true}
                containerStyle={styles.fieldGapLarge}
            />
            <View style={styles.row}>
                <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRememberMe((prev) => !prev)}
                >
                    <View style={styles.checkbox}>
                        {rememberMe ? <View style={styles.checkboxInner} /> : null}
                    </View>
                    <Text style={styles.rememberText}>{t.auth.rememberMe}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                    <Text style={styles.linkText}>{t.auth.forgotPassword}</Text>
                </TouchableOpacity>
            </View>
            <components.Button
                title={t.auth.signIn}
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                containerStyle={styles.buttonGap}
            />
            <View style={styles.footerRow}>
                <Text style={styles.footerText}>{t.auth.noAccount} </Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                    <Text style={styles.linkText}>{t.auth.registerNow}</Text>
                </TouchableOpacity>
            </View>
        </>
    );
});

export default SignInForm;
