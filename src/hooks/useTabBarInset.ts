import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Visible tab bar content area (icons + labels), excluding safe area. */
export const TAB_BAR_CONTENT_HEIGHT = 54;

/** @deprecated Prefer `useTabBarInset()` for scroll padding. */
export const TAB_BAR_HEIGHT = 82;

export function useTabBarInset(extra = 16) {
    const insets = useSafeAreaInsets();
    const bottomSafe = Math.max(insets.bottom, Platform.OS === "web" ? 8 : 0);
    return TAB_BAR_CONTENT_HEIGHT + bottomSafe + extra;
}
