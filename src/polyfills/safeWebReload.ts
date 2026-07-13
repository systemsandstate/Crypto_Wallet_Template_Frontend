import { Platform } from "react-native";

/**
 * Expo's web polyfill calls window.location.reload() without guarding location.
 * Some RN-web / embedded contexts define window but not window.location.
 * Web-only — native runtimes may define window without addEventListener.
 */
export function installSafeWebReloadPolyfill(): void {
    if (Platform.OS !== "web" || typeof globalThis === "undefined") return;

    const patchReload = (): void => {
        const expo = globalThis.expo as
            | { reloadAppAsync?: (reason?: string) => Promise<void>; __safeReloadPatched?: boolean }
            | undefined;
        if (!expo || expo.__safeReloadPatched) return;

        expo.reloadAppAsync = async () => {
            if (typeof window !== "undefined" && typeof window.location?.reload === "function") {
                window.location.reload();
            }
        };
        expo.__safeReloadPatched = true;
    };

    patchReload();

    if (typeof window !== "undefined") {
        if (typeof window.addEventListener === "function") {
            window.addEventListener("load", patchReload, { once: true });
        }
        setTimeout(patchReload, 0);
    }
}
