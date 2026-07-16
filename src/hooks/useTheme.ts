import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import { COLORS, FONTS, getColors, SIZES } from "../constants/theme";
import { useAppSelector } from "./useAppSelector";
import { setDarkMode as setDarkModeAction, toggleDarkMode as toggleDarkModeAction } from "../store/themeSlice";

export function useTheme() {
    const dispatch = useDispatch();
    const isDark = useAppSelector((state) => state.theme.isDark);

    const colors = useMemo(() => {
        const next = getColors(isDark);
        Object.assign(COLORS, next);
        return next;
    }, [isDark]);

    const toggleDarkMode = useCallback(() => {
        dispatch(toggleDarkModeAction());
    }, [dispatch]);

    const setDarkMode = useCallback(
        (value: boolean) => {
            dispatch(setDarkModeAction(value));
        },
        [dispatch]
    );

    return {
        colors,
        isDark,
        toggleDarkMode,
        setDarkMode,
        FONTS,
        SIZES,
    };
}
