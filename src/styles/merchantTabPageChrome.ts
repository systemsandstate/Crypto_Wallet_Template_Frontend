import { Platform, StyleSheet } from "react-native";

import type { AppColors } from "../constants/theme";

/** Matches MerchantTabHeader borderBottomLeft/RightRadius. */
export const MERCHANT_HEADER_CURVE = 24;

/** Shared tab-screen layout: dark bg, header curve overlap, web flex fill. */
export function createMerchantTabPageStyles(colors: Pick<AppColors, "bgColor">) {
    return StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.bgColor,
        },
        headerWrap: {
            zIndex: 30,
            elevation: 30,
        },
        contentArea: {
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflow: "hidden",
            marginTop: -MERCHANT_HEADER_CURVE,
            paddingTop: MERCHANT_HEADER_CURVE,
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
