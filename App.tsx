import { useFonts } from "expo-font";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/navigation/navigationRef";
import { logoutAndNavigateToSignIn } from "./src/navigation/logoutAndNavigateToSignIn";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Provider, useDispatch } from "react-redux";
import store from "./src/store/store";
import { setCredentials } from "./src/store/authSlice";
import { api, getAuthToken, setUnauthorizedHandler } from "./src/services/api";

import {
    Mulish_400Regular,
    Mulish_500Medium,
    Mulish_600SemiBold,
    Mulish_700Bold,
} from "@expo-google-fonts/mulish";

import StackNavigator from "./src/navigation/StackNavigator";
import SplashScreen from "./src/screens/SplashScreen";

export { navigationRef } from "./src/navigation/navigationRef";

const SPLASH_DURATION_MS = 5000;

const WEB_INPUT_STYLES = `
  input, textarea {
    outline: none !important;
    box-shadow: none !important;
  }
  input:focus, textarea:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    box-shadow: 0 0 0 1000px #ffffff inset !important;
    -webkit-text-fill-color: #1B1D4D !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const AppRoot: React.FC<{ navReady: boolean }> = ({ navReady }) => {
    const dispatch = useDispatch();
    const [splashDone, setSplashDone] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [initialRoute, setInitialRoute] = useState<"SignIn" | "TabNavigator">("SignIn");

    useEffect(() => {
        if (Platform.OS !== "web" || typeof document === "undefined") return;
        const id = "merchant-payments-input-styles";
        if (document.getElementById(id)) return;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = WEB_INPUT_STYLES;
        document.head.appendChild(style);
    }, []);

    useEffect(() => {
        const splashTimer = setTimeout(() => setSplashDone(true), SPLASH_DURATION_MS);
        return () => clearTimeout(splashTimer);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler((message) => {
            logoutAndNavigateToSignIn(dispatch, { sessionExpired: message });
        });
        return () => setUnauthorizedHandler(null);
    }, [dispatch]);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setAuthReady(true);
            return;
        }
        api.getProfile()
            .then((res) => {
                dispatch(setCredentials({ merchant: res.data, accessToken: token }));
                setInitialRoute("TabNavigator");
            })
            .catch(() => setInitialRoute("SignIn"))
            .finally(() => setAuthReady(true));
    }, [dispatch]);

    useEffect(() => {
        if (!authReady || !splashDone || !navReady || !navigationRef.isReady()) return;
        if (Platform.OS !== "web" || typeof window === "undefined" || !window.location?.search) return;

        const params = new URLSearchParams(window.location.search);
        const resetToken = params.get("resetToken");
        if (resetToken) {
            navigationRef.navigate("NewPassword", { resetToken });
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [authReady, splashDone, navReady]);

    if (!splashDone || !authReady) {
        return <SplashScreen />;
    }

    return <StackNavigator initialRoute={initialRoute} />;
};

const App: React.FC = () => {
    const [fontsLoaded] = useFonts({
        Mulish_400Regular,
        Mulish_500Medium,
        Mulish_600SemiBold,
        Mulish_700Bold,
    });
    const [navReady, setNavReady] = useState(false);

    return (
        <Provider store={store}>
            <SafeAreaProvider>
                {!fontsLoaded ? (
                    <SplashScreen />
                ) : (
                    <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
                        <AppRoot navReady={navReady} />
                    </NavigationContainer>
                )}
            </SafeAreaProvider>
        </Provider>
    );
};

export default App;
