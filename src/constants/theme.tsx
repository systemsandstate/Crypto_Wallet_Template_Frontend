import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

type FontWeight = "400" | "500" | "600" | "700";

const fontFamily = (nativeName: string, weight: FontWeight) =>
    Platform.OS === "web"
        ? { fontFamily: "Mulish", fontWeight: weight }
        : { fontFamily: nativeName };

const COLORS = {
    mainDark: "#1B1D4D",
    bodyTextColor: "#4C4C60",
    white: "#FFFFFF",
    bgColor: "#EDF0F2",
    green: "#3EB290",
    grey1: "#D8D9DB",
    linkColor: "#FF5887",
    transparent: "transparent",
};

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

export { COLORS, SIZES, FONTS, theme };
