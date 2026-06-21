import { CommonActions } from "@react-navigation/native";
import { Platform } from "react-native";

import { logout } from "../store/authSlice";
import type { AppDispatch } from "../store/store";
import { setScreen } from "../store/tabSlice";
import { navigationRef } from "./navigationRef";

export function logoutAndNavigateToSignIn(
    dispatch: AppDispatch,
    params?: { sessionExpired?: string }
) {
    dispatch(logout());
    dispatch(setScreen("Dashboard"));

    if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
            if (params?.sessionExpired) {
                sessionStorage.setItem("sessionExpired", params.sessionExpired);
            }
            window.location.replace(window.location.pathname || "/");
        }
        return;
    }

    if (navigationRef.isReady()) {
        navigationRef.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "SignIn", params }],
            })
        );
    }
}
