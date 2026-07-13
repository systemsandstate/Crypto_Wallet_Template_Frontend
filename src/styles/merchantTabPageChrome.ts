import { Platform, StyleSheet } from "react-native";

import type { AppColors } from "../constants/theme";

/** Flat header — no curve overlap in light banking layout. */
export const MERCHANT_HEADER_CURVE = 0;

/** Shared tab-screen layout: light bg, flat header. */
export function createMerchantTabPageStyles(colors: Pick<AppColors, "bgColor">) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.bgColor,
        },
        headerWrap: {
            zIndex: 10,
            backgroundColor: colors.bgColor,
        },
        contentArea: {
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflow: "hidden",
            ...(Platform.OS === "web"
                ? ({ height: "100%", display: "flex" } as object)
                : {}),
        },
        loadingWrap: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bgColor,
        },
    });
}
