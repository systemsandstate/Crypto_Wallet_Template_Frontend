import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

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
        fontFamily: "Mulish_700Bold",
        fontSize: 44,
        lineHeight: 48 * 1.2,
    },
    H2: {
        fontFamily: "Mulish_700Bold",
        fontSize: 36,
        lineHeight: 36 * 1.2,
    },
    H3: {
        fontFamily: "Mulish_700Bold",
        fontSize: 28,
        lineHeight: 28 * 1.2,
    },
    H4: {
        fontFamily: "Mulish_500Medium",
        fontSize: 20,
        lineHeight: 20 * 1.2,
    },
    H5: {
        fontFamily: "Mulish_600SemiBold",
        fontSize: 16,
        lineHeight: 16 * 1.3,
    },
    H6: {
        fontFamily: "Mulish_600SemiBold",
        fontSize: 14,
        lineHeight: 14 * 1.6,
    },
    Mulish_400Regular: {
        fontFamily: "Mulish_400Regular",
    },
    Mulish_500Medium: {
        fontFamily: "Mulish_500Medium",
    },
    Mulish_600SemiBold: {
        fontFamily: "Mulish_600SemiBold",
    },
    Mulish_700Bold: {
        fontFamily: "Mulish_700Bold",
    },
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
