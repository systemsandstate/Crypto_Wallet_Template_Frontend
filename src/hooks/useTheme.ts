import { useCallback, useMemo } from "react";

import { COLORS, FONTS, getColors, SIZES } from "../constants/theme";

export function useTheme() {
    const isDark = false;
    const colors = useMemo(() => {
        const next = getColors(false);
        Object.assign(COLORS, next);
        return next;
    }, []);

    const onSetDarkMode = useCallback(() => {
        // Light-only UI.
    }, []);

    return {
        colors,
        isDark,
        toggleDarkMode: onSetDarkMode,
        setDarkMode: onSetDarkMode,
        FONTS,
        SIZES,
    };
}
