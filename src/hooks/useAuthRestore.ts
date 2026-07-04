import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { DEFAULT_LOCALE } from "../i18n";
import { api, hydrateAuthToken, setAuthToken } from "../services/api";
import { logout, setCredentials } from "../store/authSlice";
import { hydrateLocale, loadStoredLocale } from "../store/localeSlice";
import { hydrateTheme, loadStoredTheme } from "../store/themeSlice";
import { safeReset } from "../utils/safeNavigation";
import { syncPushTokenWithBackend } from "../services/pushNotifications";
import { syncDeviceWalletToServer } from "../services/wallet/syncDeviceWallet";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => {
            setTimeout(() => resolve(fallback), ms);
        }),
    ]);
}

/**
 * Restores locale + session in the background after the navigator is mounted.
 * Does not block the UI — navigation proceeds to Sign In immediately.
 */
export function useAuthRestore() {
    const dispatch = useDispatch();
    const restoredRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const locale = await withTimeout(loadStoredLocale(), 3000, DEFAULT_LOCALE);
            if (!cancelled) dispatch(hydrateLocale(locale));

            const isDark = await withTimeout(loadStoredTheme(), 3000, false);
            if (!cancelled) dispatch(hydrateTheme(isDark));

            const token = await withTimeout(hydrateAuthToken(), 3000, null);
            if (!token || cancelled || restoredRef.current) return;

            try {
                const res = await withTimeout(
                    api.getProfile(),
                    5000,
                    null as Awaited<ReturnType<typeof api.getProfile>> | null
                );
                if (!res || cancelled || restoredRef.current) {
                    setAuthToken(null);
                    dispatch(logout());
                    return;
                }

                dispatch(
                    setCredentials({
                        merchant: res.data,
                        accessToken: token,
                    })
                );
                restoredRef.current = true;
                // Device wallet is source of truth for balance/history on this browser.
                await syncDeviceWalletToServer();
                safeReset([{ name: "TabNavigator" }]);
                void syncPushTokenWithBackend();
            } catch {
                if (cancelled) return;
                setAuthToken(null);
                dispatch(logout());
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [dispatch]);
}
