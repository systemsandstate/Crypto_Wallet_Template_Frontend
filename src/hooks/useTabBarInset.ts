import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DENSITY } from "../constants/density";

/** Visible tab bar content area (icons + labels), excluding safe area. */
export const TAB_BAR_CONTENT_HEIGHT = DENSITY.tabBarContent;

/** Flat tab bar — no overlap with content. */
export const TAB_BAR_TOP_OVERLAP = 0;

/** Inner paddingTop on BottomTabBar row. */
export const TAB_BAR_PADDING_TOP = DENSITY.tabBarPaddingTop;

/** @deprecated Prefer `useTabBarInset()` for scroll padding. */
export const TAB_BAR_HEIGHT = 82;

export function getTabBarOccupiedHeight(bottomInset = 0) {
    const bottomSafe = Math.max(bottomInset, Platform.OS === "web" ? 8 : 0);
    return TAB_BAR_CONTENT_HEIGHT + TAB_BAR_PADDING_TOP + bottomSafe + TAB_BAR_TOP_OVERLAP;
}

export function useTabBarInset(extra = 16) {
    const insets = useSafeAreaInsets();
    return getTabBarOccupiedHeight(insets.bottom) + extra;
}

/** Bottom padding for fixed footers sitting above the tab bar. */
export function useTabBarFooterInset(extra = 12) {
    const insets = useSafeAreaInsets();
    return getTabBarOccupiedHeight(insets.bottom) + extra;
}

/**
 * Footer + scroll padding for stack screens rendered above the tab bar (e.g. Transfer).
 * Uses only the tab bar overlap — not the full tab bar height — so the button is not
 * pushed up with a large empty gap on web.
 */
export function useTabStackFooterLayout(options?: {
    buttonHeight?: number;
    footerPaddingTop?: number;
    overlapClearance?: number;
}) {
    const insets = useSafeAreaInsets();
    const { buttonHeight = 52, footerPaddingTop = 12, overlapClearance = 8 } = options ?? {};
    const bottomSafe = Math.max(insets.bottom, Platform.OS === "web" ? 8 : 0);
    const footerPaddingBottom = TAB_BAR_TOP_OVERLAP + overlapClearance + bottomSafe;
    const footerHeight = footerPaddingTop + buttonHeight;

    return {
        footerPaddingBottom,
        scrollPaddingBottom: footerHeight + 16,
    };
}

/** Fixed footer + scroll padding for screens with a pinned bottom button. */
export function useFixedFooterLayout(options?: {
    buttonHeight?: number;
    footerPaddingTop?: number;
    extra?: number;
}) {
    const { buttonHeight = 40, footerPaddingTop = 10, extra = 12 } = options ?? {};
    const footerPaddingBottom = useTabBarFooterInset(extra);
    const footerHeight = footerPaddingTop + buttonHeight;

    return {
        footerPaddingBottom,
        scrollPaddingBottom: footerHeight + footerPaddingBottom,
    };
}
