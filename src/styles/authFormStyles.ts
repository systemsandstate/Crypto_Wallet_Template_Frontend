import { TextStyle, ViewStyle } from "react-native";

import type { AppColors } from "../constants/theme";
import { FONTS as ThemeFontsConst } from "../constants/theme";

type ThemeFonts = typeof ThemeFontsConst;

export const createAuthFormStyles = (colors: AppColors, FONTS: ThemeFonts) => ({
    linkText: {
        color: colors.accentBlue,
        ...FONTS.Mulish_600SemiBold,
        fontSize: 13,
    } as TextStyle,
    mutedText: {
        ...FONTS.Mulish_400Regular,
        color: colors.bodyTextColor,
        fontSize: 13,
    } as TextStyle,
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    } as ViewStyle,
    rememberRow: {
        flexDirection: "row",
        alignItems: "center",
    } as ViewStyle,
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 5,
        backgroundColor: colors.white,
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center",
    } as ViewStyle,
    checkboxChecked: {
        backgroundColor: colors.accentBlue,
        borderColor: colors.accentBlue,
    } as ViewStyle,
    checkMark: {
        color: colors.pureWhite,
        fontSize: 11,
        lineHeight: 12,
        fontWeight: "700",
    } as TextStyle,
    rememberText: {
        color: colors.bodyTextColor,
        ...FONTS.Mulish_400Regular,
        fontSize: 13,
    } as TextStyle,
    buttonGap: {
        marginBottom: 4,
    } as ViewStyle,
});
