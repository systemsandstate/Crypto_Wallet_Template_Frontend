import { Platform, StyleSheet, View, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import * as ExpoSplashScreen from "expo-splash-screen";
import { navigationRef } from "./src/navigation/navigationRef";
import { logoutAndNavigateToSignIn } from "./src/navigation/logoutAndNavigateToSignIn";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import store from "./src/store/store";
import { getDictionary } from "./src/i18n";
import { setUnauthorizedHandler } from "./src/services/api";
import { useAppFonts } from "./src/hooks/useAppFonts";
import { useAuthRestore } from "./src/hooks/useAuthRestore";
import { usePushNotifications } from "./src/hooks/usePushNotifications";
import { useWebInputStyles } from "./src/hooks/useWebInputStyles";

import AppShell from "./src/components/AppShell";
import ToastHost from "./src/components/ToastHost";
import StackNavigator from "./src/navigation/StackNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { useTheme } from "./src/hooks/useTheme";

export { navigationRef } from "./src/navigation/navigationRef";

const AppRoot: React.FC = () => {
    const dispatch = useDispatch();
    const { isDark } = useTheme();

    useWebInputStyles();
    useAuthRestore();
    usePushNotifications();

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

    return (
        <View style={styles.root}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <StackNavigator initialRoute="SignIn" />
            <ToastHost />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
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
                        <NavigationContainer ref={navigationRef}>
                            <AppShell>
                                <AppRoot />
                            </AppShell>
                        </NavigationContainer>
                    </SafeAreaProvider>
                </GestureHandlerRootView>
            </Provider>
        </ErrorBoundary>
    );
};

export default App;
