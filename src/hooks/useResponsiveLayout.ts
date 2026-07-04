import { useWindowDimensions, Platform } from "react-native";

const COMPACT_WIDTH = 380;
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1024;
const WIDE_WIDTH = 1440;

const AUTH_CARD_MAX_WIDTH = 440;

/** Stretch the app column with the viewport, with sensible caps per breakpoint. */
function getAppMaxWidth(width: number): number {
    if (width < TABLET_WIDTH) {
        return width;
    }
    if (width < DESKTOP_WIDTH) {
        return Math.min(Math.round(width * 0.94), 900);
    }
    if (width < WIDE_WIDTH) {
        return Math.min(Math.round(width * 0.9), 1120);
    }
    return Math.min(Math.round(width * 0.86), 1320);
}

export function useResponsiveLayout() {
    const { width, height } = useWindowDimensions();
    const isCompact = width < COMPACT_WIDTH;
    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;
    const isWide = width >= WIDE_WIDTH;
    const horizontalPadding = isCompact ? 16 : isDesktop ? 28 : 20;
    const appMaxWidth = getAppMaxWidth(width);
    const contentMaxWidth = appMaxWidth;
    const authCardMaxWidth = Math.min(AUTH_CARD_MAX_WIDTH, width - horizontalPadding * 2);
    const centerAppOnWeb = Platform.OS === "web" && width >= TABLET_WIDTH;

    return {
        width,
        height,
        isCompact,
        isTablet,
        isDesktop,
        isWide,
        horizontalPadding,
        contentMaxWidth,
        authCardMaxWidth,
        appMaxWidth: centerAppOnWeb ? appMaxWidth : undefined,
        centerAppOnWeb,
    };
}
