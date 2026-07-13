import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "appDarkMode";

interface ThemeState {
    isDark: boolean;
    hydrated: boolean;
}

const initialState: ThemeState = {
    isDark: false,
    hydrated: true,
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setDarkMode: (state) => {
            // App is light-only for the banking UI refresh.
            state.isDark = false;
            void AsyncStorage.setItem(THEME_STORAGE_KEY, "0");
        },
        toggleDarkMode: (state) => {
            state.isDark = false;
            void AsyncStorage.setItem(THEME_STORAGE_KEY, "0");
        },
        hydrateTheme: (state) => {
            state.isDark = false;
            state.hydrated = true;
        },
    },
});

export const { setDarkMode, toggleDarkMode, hydrateTheme } = themeSlice.actions;

/** Always light — clears legacy dark preference saved when the app was dark-only. */
export async function loadStoredTheme(): Promise<boolean> {
    try {
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
        // ignore
    }
    return false;
}

export default themeSlice.reducer;
