import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useDispatch } from "react-redux";

import { COLORS, FONTS, getColors, SIZES } from "../constants/theme";
import { setDarkMode, toggleDarkMode } from "../store/themeSlice";
import store from "../store/store";

const subscribe = (onStoreChange: () => void) => store.subscribe(onStoreChange);
const getIsDark = () => store.getState().theme.isDark;

export function useTheme() {
    const dispatch = useDispatch();
    const isDark = useSyncExternalStore(subscribe, getIsDark, getIsDark);
    const colors = useMemo(() => getColors(isDark), [isDark]);

    useEffect(() => {
        Object.assign(COLORS, colors);
    }, [colors]);

    const onToggleDarkMode = useCallback(() => {
        dispatch(toggleDarkMode());
    }, [dispatch]);

    const onSetDarkMode = useCallback(
        (value: boolean) => {
            dispatch(setDarkMode(value));
        },
        [dispatch]
    );

    return {
        colors,
        isDark,
        toggleDarkMode: onToggleDarkMode,
        setDarkMode: onSetDarkMode,
        FONTS,
        SIZES,
    };
}
