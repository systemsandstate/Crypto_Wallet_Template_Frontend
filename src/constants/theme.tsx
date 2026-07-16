import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

type FontWeight = "400" | "500" | "600" | "700";

const fontFamily = (nativeName: string, weight: FontWeight) =>
    Platform.OS === "web"
        ? { fontFamily: "Mulish", fontWeight: weight }
        : { fontFamily: nativeName };

export type AppColors = {
    mainDark: string;
    bodyTextColor: string;
    white: string;
    bgColor: string;
    green: string;
    red: string;
    grey1: string;
    linkColor: string;
    transparent: string;
    border: string;
    surfaceMuted: string;
    rowPress: string;
    headerBg: string;
    headerMuted: string;
    selectedBg: string;
    accentBlue: string;
    shellBg: string;
    overlay: string;
    inputBorder: string;
    placeholder: string;
    icon: string;
    /** Always #FFFFFF — use for borders and icons on dark surfaces (not `white`). */
    pureWhite: string;
};

const LIGHT_COLORS: AppColors = {
    mainDark: "#1A1F36",
    bodyTextColor: "#6B7280",
    white: "#FFFFFF",
    bgColor: "#F5F7FA",
    green: "#059669",
    red: "#DC2626",
    grey1: "#E5E7EB",
    linkColor: "#2563EB",
    transparent: "transparent",
    border: "#E5E7EB",
    surfaceMuted: "#F9FAFB",
    rowPress: "#F3F4F6",
    headerBg: "#FFFFFF",
    headerMuted: "#6B7280",
    selectedBg: "#EFF6FF",
    accentBlue: "#2563EB",
    shellBg: "#FFFFFF",
    overlay: "rgba(17, 24, 39, 0.4)",
    inputBorder: "#E5E7EB",
    placeholder: "#9CA3AF",
    icon: "#6B7280",
    pureWhite: "#FFFFFF",
};

const DARK_COLORS: AppColors = {
    mainDark: "#F2F3F7",
    bodyTextColor: "#9DA3B8",
    white: "#1A1A22",
    bgColor: "#0E0E13",
    green: "#4CC9A0",
    red: "#F07171",
    grey1: "#3A3A48",
    linkColor: "#E0BD54",
    transparent: "transparent",
    border: "#2A2A36",
    surfaceMuted: "#22222C",
    rowPress: "#252530",
    headerBg: "#12121C",
    headerMuted: "#8B93A8",
    selectedBg: "#2E2A22",
    accentBlue: "#E0BD54",
    shellBg: "#08080C",
    overlay: "rgba(14, 14, 19, 0.55)",
    inputBorder: "#333340",
    placeholder: "#6B7080",
    icon: "#B0B4C4",
    pureWhite: "#FFFFFF",
};

export function getColors(isDark?: boolean): AppColors {
    return isDark ? DARK_COLORS : LIGHT_COLORS;
}

const COLORS = { ...LIGHT_COLORS };

const FONTS = {
    H1: {
        ...fontFamily("Mulish_700Bold", "700"),
        fontSize: 36,
        lineHeight: 40,
    },
    H2: {
        ...fontFamily("Mulish_700Bold", "700"),
        fontSize: 30,
        lineHeight: 34,
    },
    H3: {
        ...fontFamily("Mulish_700Bold", "700"),
        fontSize: 24,
        lineHeight: 28,
    },
    H4: {
        ...fontFamily("Mulish_500Medium", "500"),
        fontSize: 17,
        lineHeight: 21,
    },
    H5: {
        ...fontFamily("Mulish_600SemiBold", "600"),
        fontSize: 14,
        lineHeight: 18,
    },
    H6: {
        ...fontFamily("Mulish_600SemiBold", "600"),
        fontSize: 13,
        lineHeight: 17,
    },
    Mulish_400Regular: fontFamily("Mulish_400Regular", "400"),
    Mulish_500Medium: fontFamily("Mulish_500Medium", "500"),
    Mulish_600SemiBold: fontFamily("Mulish_600SemiBold", "600"),
    Mulish_700Bold: fontFamily("Mulish_700Bold", "700"),
};

const SIZES = {
    width,
    height,
};

const theme = {
    COLORS,
    SIZES,
    FONTS,
};

export { COLORS, SIZES, FONTS, theme, LIGHT_COLORS, DARK_COLORS };
