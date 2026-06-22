import {
    View,
    TouchableOpacity,
    Text,
    Alert,
    StyleSheet,
    Keyboard,
    Platform,
} from "react-native";
import React, { useState, useCallback, memo, useRef } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";

import { theme } from "../constants";
import { components } from "../components";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { api } from "../services/api";
import { setCredentials } from "../store/authSlice";
import { safeReset } from "../utils/safeNavigation";
import type { getDictionary } from "../i18n";

type TranslationDict = ReturnType<typeof getDictionary>;

type Props = {
    t: TranslationDict;
    navigation: NativeStackNavigationProp<any>;
};

const SignInForm = memo(function SignInForm({ t, navigation }: Props) {
    const dispatch = useDispatch();
    const { isCompact } = useResponsiveLayout();
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const useRefs = Platform.OS !== "web";

    const onEmailChange = useCallback(
        (text: string) => {
            emailRef.current = text;
            if (!useRefs) setEmail(text);
        },
        [useRefs]
    );

    const onPasswordChange = useCallback(
        (text: string) => {
            passwordRef.current = text;
            if (!useRefs) setPassword(text);
        },
        [useRefs]
    );

    const handleSignIn = useCallback(() => {
        const trimmedEmail = (useRefs ? emailRef.current : email).trim();
        const pwd = useRefs ? passwordRef.current : password;

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
            } catch (err: any) {
                Alert.alert(t.auth.signInFailed, err.message || t.auth.invalidCredentials);
                setLoading(false);
            }
        })();
    }, [dispatch, email, loading, password, t, useRefs]);

    return (
        <>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>{t.auth.appTitle}</Text>
            <Text style={styles.subtitle}>{t.auth.appSubtitle}</Text>
            <components.InputField
                placeholder={t.auth.emailPlaceholder}
                value={useRefs ? undefined : email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.fieldGap}
            />
            <components.InputField
                placeholder={t.auth.passwordPlaceholder}
                value={useRefs ? undefined : password}
                onChangeText={onPasswordChange}
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

const styles = StyleSheet.create({
    title: {
        textAlign: "center",
        ...theme.FONTS.H1,
        color: theme.COLORS.mainDark,
        marginBottom: 8,
    },
    titleCompact: {
        fontSize: 32,
        lineHeight: 38,
    },
    subtitle: {
        textAlign: "center",
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 14,
        color: theme.COLORS.bodyTextColor,
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
        width: 16,
        height: 16,
        borderWidth: 1,
        borderColor: "#868698",
        borderRadius: 4,
        backgroundColor: theme.COLORS.white,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxInner: {
        width: 8,
        height: 8,
        borderRadius: 2,
        backgroundColor: "#868698",
    },
    rememberText: {
        color: theme.COLORS.bodyTextColor,
        ...theme.FONTS.Mulish_400Regular,
        fontSize: 16,
    },
    linkText: {
        color: theme.COLORS.linkColor,
        ...theme.FONTS.Mulish_400Regular,
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
        ...theme.FONTS.Mulish_400Regular,
        color: theme.COLORS.bodyTextColor,
        fontSize: 16,
    },
});

export default SignInForm;
