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
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
