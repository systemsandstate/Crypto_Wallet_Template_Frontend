import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import localeReducer from "./localeSlice";
import themeReducer from "./themeSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        locale: localeReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Theme/locale hydrate on many screens — avoid noisy dev warnings.
                warnAfter: 128,
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
