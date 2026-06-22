import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import {
    Mulish_400Regular,
    Mulish_500Medium,
    Mulish_600SemiBold,
    Mulish_700Bold,
} from "@expo-google-fonts/mulish";

const FONT_TIMEOUT_MS = Platform.OS === "web" ? 5000 : 0;

/** On native, never block startup for fonts (common Expo Go hang). */
export function useAppFonts(): boolean {
    const [loaded, error] = useFonts({
        Mulish_400Regular,
        Mulish_500Medium,
        Mulish_600SemiBold,
        Mulish_700Bold,
    });
    const [timedOut, setTimedOut] = useState(Platform.OS !== "web");

    useEffect(() => {
        if (Platform.OS !== "web") return;
        if (loaded || error) {
            setTimedOut(true);
            return;
        }
        const timer = setTimeout(() => setTimedOut(true), FONT_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [loaded, error]);

    if (Platform.OS !== "web") return true;
    return loaded || !!error || timedOut;
}
