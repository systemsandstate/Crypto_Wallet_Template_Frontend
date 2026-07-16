import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "appDarkMode";

interface ThemeState {
    isDark: boolean;
    hydrated: boolean;
}

const initialState: ThemeState = {
    isDark: false,
    hydrated: false,
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDark = action.payload;
            void AsyncStorage.setItem(THEME_STORAGE_KEY, action.payload ? "1" : "0");
        },
        toggleDarkMode: (state) => {
            state.isDark = !state.isDark;
            void AsyncStorage.setItem(THEME_STORAGE_KEY, state.isDark ? "1" : "0");
        },
        hydrateTheme: (state, action: PayloadAction<boolean>) => {
            state.isDark = action.payload;
            state.hydrated = true;
        },
    },
});

export const { setDarkMode, toggleDarkMode, hydrateTheme } = themeSlice.actions;

export async function loadStoredTheme(): Promise<boolean> {
    try {
        const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        return raw === "1";
    } catch {
        return false;
    }
}

export default themeSlice.reducer;
