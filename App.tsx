import { Platform, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import * as ExpoSplashScreen from "expo-splash-screen";
import { navigationRef } from "./src/navigation/navigationRef";
import { logoutAndNavigateToSignIn } from "./src/navigation/logoutAndNavigateToSignIn";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import store, { type RootState } from "./src/store/store";
import { getDictionary } from "./src/i18n";
import { setUnauthorizedHandler } from "./src/services/api";
import { useAppFonts } from "./src/hooks/useAppFonts";
import { useAuthRestore } from "./src/hooks/useAuthRestore";
import { useWebInputStyles } from "./src/hooks/useWebInputStyles";

import AppShell from "./src/components/AppShell";
import StackNavigator from "./src/navigation/StackNavigator";
import SplashScreen from "./src/screens/SplashScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { LanguagePickerProvider } from "./src/context/LanguagePickerContext";
import { LanguageSwitcherToneProvider } from "./src/context/LanguageSwitcherToneContext";

export { navigationRef } from "./src/navigation/navigationRef";

const SPLASH_DURATION_MS = 1200;

const AppRoot: React.FC = () => {
    const dispatch = useDispatch();
    const locale = useSelector((state: RootState) => state.locale.locale);
    const [splashVisible, setSplashVisible] = useState(true);

    useWebInputStyles();
    useAuthRestore();

    useEffect(() => {
        void ExpoSplashScreen.hideAsync().catch(() => {});
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            const currentLocale = store.getState().locale.locale;
            const t = getDictionary(currentLocale);
            logoutAndNavigateToSignIn(dispatch, { sessionExpired: t.common.sessionExpiredMessage });
        });
        return () => setUnauthorizedHandler(null);
    }, [dispatch]);

    useEffect(() => {
        if (Platform.OS !== "web" || typeof window === "undefined" || !window.location?.search) {
            return;
        }
        if (!navigationRef.isReady()) return;

        const params = new URLSearchParams(window.location.search);
        const resetToken = params.get("resetToken");
        if (resetToken) {
            navigationRef.navigate("NewPassword", { resetToken });
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setSplashVisible(false), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.root}>
            <StackNavigator initialRoute="SignIn" />
            {splashVisible ? (
                <View style={styles.splashOverlay} pointerEvents="none">
                    <SplashScreen locale={locale} />
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    splashOverlay: {
        ...StyleSheet.absoluteFill,
        zIndex: 10,
    },
});

const App: React.FC = () => {
    useAppFonts();

    useEffect(() => {
        void ExpoSplashScreen.hideAsync().catch(() => {});
    }, []);

    return (
        <ErrorBoundary>
            <Provider store={store}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <SafeAreaProvider>
                        <LanguagePickerProvider>
                            <NavigationContainer ref={navigationRef}>
                                <AppShell>
                                    <LanguageSwitcherToneProvider>
                                        <AppRoot />
                                    </LanguageSwitcherToneProvider>
                                </AppShell>
                            </NavigationContainer>
                        </LanguagePickerProvider>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </Provider>
        </ErrorBoundary>
    );
};

export default App;
