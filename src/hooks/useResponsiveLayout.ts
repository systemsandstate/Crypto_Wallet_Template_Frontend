import { useWindowDimensions, Platform } from "react-native";

const COMPACT_WIDTH = 380;
const WIDE_WIDTH = 768;
const APP_MAX_WIDTH = 560;
const AUTH_CARD_MAX_WIDTH = 440;

export function useResponsiveLayout() {
    const { width, height } = useWindowDimensions();
    const isCompact = width < COMPACT_WIDTH;
    const isWide = width >= WIDE_WIDTH;
    const horizontalPadding = isCompact ? 16 : 20;
    const contentMaxWidth = Math.min(width, isWide ? APP_MAX_WIDTH : width);
    const authCardMaxWidth = Math.min(AUTH_CARD_MAX_WIDTH, width - horizontalPadding * 2);
    const centerAppOnWeb = Platform.OS === "web" && isWide;

    return {
        width,
        height,
        isCompact,
        isWide,
        horizontalPadding,
        contentMaxWidth,
        authCardMaxWidth,
        appMaxWidth: centerAppOnWeb ? APP_MAX_WIDTH : undefined,
        centerAppOnWeb,
    };
}
