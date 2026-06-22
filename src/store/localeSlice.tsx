import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppLocale, DEFAULT_LOCALE } from "../i18n";

const LOCALE_STORAGE_KEY = "appLocale";

interface LocaleState {
    locale: AppLocale;
    hydrated: boolean;
}

const initialState: LocaleState = {
    locale: DEFAULT_LOCALE,
    hydrated: true,
};

const localeSlice = createSlice({
    name: "locale",
    initialState,
    reducers: {
        setLocale: (state, action: PayloadAction<AppLocale>) => {
            state.locale = action.payload;
            void AsyncStorage.setItem(LOCALE_STORAGE_KEY, action.payload);
        },
        hydrateLocale: (state, action: PayloadAction<AppLocale>) => {
            state.locale = action.payload;
            state.hydrated = true;
        },
    },
});

export const { setLocale, hydrateLocale } = localeSlice.actions;

export async function loadStoredLocale(): Promise<AppLocale> {
    try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored === "es" || stored === "en") return stored;
    } catch {
        // ignore
    }
    return DEFAULT_LOCALE;
}

export default localeSlice.reducer;
