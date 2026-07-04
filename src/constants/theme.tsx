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
    mainDark: "#1B1D4D",
    bodyTextColor: "#4C4C60",
    white: "#FFFFFF",
    bgColor: "#EDF0F2",
    green: "#3EB290",
    grey1: "#D8D9DB",
    linkColor: "#FF5887",
    transparent: "transparent",
    border: "#EBEBEB",
    surfaceMuted: "#F8F9FB",
    rowPress: "#F5F5F5",
    headerBg: "#1B1D4D",
    headerMuted: "#CED6E1",
    selectedBg: "#EEF3FF",
    accentBlue: "#5B8DEF",
    shellBg: "#D8DEE8",
    overlay: "rgba(237, 240, 242, 0.35)",
    inputBorder: "#E2E8F0",
    placeholder: "#868698",
    icon: "#4C4C60",
    pureWhite: "#FFFFFF",
};

const DARK_COLORS: AppColors = {
    mainDark: "#E8EAF0",
    bodyTextColor: "#9DA3B8",
    white: "#1A1A22",
    bgColor: "#0E0E13",
    green: "#3EB290",
    grey1: "#3A3A48",
    linkColor: "#FF7AA0",
    transparent: "transparent",
    border: "#2A2A36",
    surfaceMuted: "#22222C",
    rowPress: "#252530",
    headerBg: "#12121C",
    headerMuted: "#8B93A8",
    selectedBg: "#252B3D",
    accentBlue: "#6B9FFF",
    shellBg: "#08080C",
    overlay: "rgba(14, 14, 19, 0.55)",
    inputBorder: "#333340",
    placeholder: "#6B7080",
    icon: "#B0B4C4",
    pureWhite: "#FFFFFF",
};

export function getColors(isDark: boolean): AppColors {
    return isDark ? DARK_COLORS : LIGHT_COLORS;
}

const COLORS = { ...LIGHT_COLORS };

const FONTS = {
    H1: {
        ...fontFamily("Mulish_700Bold", "700"),
        fontSize: 44,
        lineHeight: 48 * 1.2,
    },
    H2: {
        ...fontFamily("Mulish_700Bold", "700"),
        fontSize: 36,
        lineHeight: 36 * 1.2,
    },
    H3: {
        ...fontFamily("Mulish_700Bold", "700"),
        fontSize: 28,
        lineHeight: 28 * 1.2,
    },
    H4: {
        ...fontFamily("Mulish_500Medium", "500"),
        fontSize: 20,
        lineHeight: 20 * 1.2,
    },
    H5: {
        ...fontFamily("Mulish_600SemiBold", "600"),
        fontSize: 16,
        lineHeight: 16 * 1.3,
    },
    H6: {
        ...fontFamily("Mulish_600SemiBold", "600"),
        fontSize: 14,
        lineHeight: 14 * 1.6,
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
