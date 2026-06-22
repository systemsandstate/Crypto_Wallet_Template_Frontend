import { configureStore } from "@reduxjs/toolkit";

import cartReducer from "./cartSlice";
import wishlistReducer from "./wishlistSlice";
import tabReducer from "./tabSlice";
import authReducer from "./authSlice";
import localeReducer from "./localeSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        locale: localeReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        tab: tabReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
