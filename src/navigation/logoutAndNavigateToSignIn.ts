import { Platform } from "react-native";

import { logout } from "../store/authSlice";
import type { AppDispatch } from "../store/store";
import { safeReset } from "../utils/safeNavigation";

export function logoutAndNavigateToSignIn(
    dispatch: AppDispatch,
    params?: { sessionExpired?: string }
) {
    dispatch(logout());

    if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
            if (params?.sessionExpired) {
                sessionStorage.setItem("sessionExpired", params.sessionExpired);
            }
            window.location.replace(window.location.pathname || "/");
        }
        return;
    }

    safeReset([{ name: "SignIn", params }]);
}
