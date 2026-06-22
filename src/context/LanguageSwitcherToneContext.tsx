import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { InteractionManager, Platform } from "react-native";

import { navigationRef } from "../navigation/navigationRef";
import { getFocusedRouteName } from "../utils/safeNavigation";

export type LanguageSwitcherTone = "on-light" | "on-dark";

/** Screens where the language button sits over a dark header area. */
const DARK_HEADER_ROUTES = new Set([
    "Dashboard",
    "AnalyticsMain",
    "ProfileMain",
    "TransactionHistory",
    "CreateInvoice",
]);

type ContextValue = {
    tone: LanguageSwitcherTone;
};

const LanguageSwitcherToneContext = createContext<ContextValue>({ tone: "on-light" });

export function LanguageSwitcherToneProvider({ children }: { children: React.ReactNode }) {
    const [tone, setTone] = useState<LanguageSwitcherTone>("on-light");
    const syncFrameRef = useRef<number | null>(null);

    const applyTone = useCallback(() => {
        if (!navigationRef.isReady()) return;
        const routeName = getFocusedRouteName(navigationRef.getRootState());
        const next: LanguageSwitcherTone =
            routeName && DARK_HEADER_ROUTES.has(routeName) ? "on-dark" : "on-light";
        setTone((prev) => (prev === next ? prev : next));
    }, []);

    const syncToneFromNavigation = useCallback(() => {
        if (syncFrameRef.current !== null) {
            cancelAnimationFrame(syncFrameRef.current);
        }
        syncFrameRef.current = requestAnimationFrame(() => {
            syncFrameRef.current = null;
            InteractionManager.runAfterInteractions(() => {
                const delay = Platform.OS === "android" ? 32 : 0;
                setTimeout(applyTone, delay);
            });
        });
    }, [applyTone]);

    useEffect(() => {
        syncToneFromNavigation();
        const unsubscribe = navigationRef.addListener("state", syncToneFromNavigation);
        return () => {
            unsubscribe();
            if (syncFrameRef.current !== null) {
                cancelAnimationFrame(syncFrameRef.current);
            }
        };
    }, [syncToneFromNavigation]);

    const value = useMemo(() => ({ tone }), [tone]);

    return (
        <LanguageSwitcherToneContext.Provider value={value}>
            {children}
        </LanguageSwitcherToneContext.Provider>
    );
}

export function useLanguageSwitcherAppearance() {
    const { tone } = useContext(LanguageSwitcherToneContext);
    const onDarkHeader = tone === "on-dark";

    if (onDarkHeader) {
        return {
            onDarkHeader: true,
            iconColor: "#FFFFFF",
            textColor: "#FFFFFF",
        };
    }

    return {
        onDarkHeader: false,
        iconColor: "#222325",
        textColor: "#222325",
    };
}
