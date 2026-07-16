import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Updates from "expo-updates";

/**
 * Silently applies EAS Updates on native builds when a new JS bundle is published.
 * No-op on web, Expo Go / __DEV__, or when updates are disabled in the binary.
 */
export function useAppUpdates() {
    const checkingRef = useRef(false);

    useEffect(() => {
        if (Platform.OS === "web" || __DEV__ || !Updates.isEnabled) {
            return;
        }

        const checkAndApply = async () => {
            if (checkingRef.current) return;
            checkingRef.current = true;
            try {
                const result = await Updates.checkForUpdateAsync();
                if (!result.isAvailable) return;
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
            } catch {
                // Network / config errors — keep running the current bundle.
            } finally {
                checkingRef.current = false;
            }
        };

        void checkAndApply();

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                void checkAndApply();
            }
        });

        return () => sub.remove();
    }, []);
}
