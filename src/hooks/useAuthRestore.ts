import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { DEFAULT_LOCALE } from "../i18n";
import { api, hydrateAuthToken, persistAuthToken, setAuthToken } from "../services/api";
import { logout, setCredentials } from "../store/authSlice";
import { hydrateLocale, loadStoredLocale } from "../store/localeSlice";
import { hydrateTheme, loadStoredTheme } from "../store/themeSlice";
import { safeReset } from "../utils/safeNavigation";
import { syncPushTokenWithBackend } from "../services/pushNotifications";
import { syncDeviceWalletInBackground } from "../services/wallet/syncDeviceWallet";
import { clearWalletSession, setWalletMerchantContext } from "../services/wallet/walletStorage";

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
            const [locale, isDark, token] = await Promise.all([
                withTimeout(loadStoredLocale(), 1500, DEFAULT_LOCALE),
                withTimeout(loadStoredTheme(), 1500, false),
                withTimeout(hydrateAuthToken(), 1500, null),
            ]);

            if (!cancelled) {
                dispatch(hydrateLocale(locale));
                dispatch(hydrateTheme(isDark));
            }

            if (!token || cancelled || restoredRef.current) return;

            try {
                const res = await withTimeout(
                    api.getProfile(),
                    4000,
                    null as Awaited<ReturnType<typeof api.getProfile>> | null
                );
                if (!res || cancelled || restoredRef.current) {
                    setAuthToken(null);
                    void clearWalletSession();
                    dispatch(logout());
                    return;
                }

                dispatch(
                    setCredentials({
                        merchant: res.data,
                        accessToken: token,
                    })
                );
                await persistAuthToken(token);
                restoredRef.current = true;
                safeReset([{ name: "TabNavigator" }]);
                void setWalletMerchantContext(res.data.id);
                syncDeviceWalletInBackground();
                void syncPushTokenWithBackend();
            } catch {
                if (cancelled) return;
                setAuthToken(null);
                void clearWalletSession();
                dispatch(logout());
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [dispatch]);
}
