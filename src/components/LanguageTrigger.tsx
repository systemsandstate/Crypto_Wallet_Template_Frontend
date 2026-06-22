import React from "react";
import { Text, TouchableOpacity, Platform, StyleSheet } from "react-native";

import LocaleFlag from "./LocaleFlag";
import { theme } from "../constants";
import { LOCALES } from "../i18n";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguagePicker } from "../context/LanguagePickerContext";
import type { LanguageSwitcherTone } from "../context/LanguageSwitcherToneContext";

type Props = {
    tone?: LanguageSwitcherTone;
};

const LanguageTrigger: React.FC<Props> = ({ tone = "on-light" }) => {
    const { openPicker } = useLanguagePicker();
    const { t, locale } = useTranslation();
    const onDark = tone === "on-dark";
    const textColor = onDark ? "#FFFFFF" : "#222325";

    return (
        <TouchableOpacity
            style={[
                styles.trigger,
                onDark ? styles.triggerOnDark : styles.triggerOnLight,
            ]}
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel={`${t.language.title}: ${LOCALES[locale].nativeLabel}`}
            activeOpacity={0.65}
        >
            <LocaleFlag locale={locale} size={20} />
            <Text style={[styles.label, { color: textColor }, onDark && styles.labelOnDark]}>
                {LOCALES[locale].label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        ...(Platform.OS === "web" ? { cursor: "pointer" as const } : {}),
    },
    triggerOnLight: {
        borderColor: "rgba(34, 35, 37, 0.35)",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
    },
    triggerOnDark: {
        borderColor: "rgba(255, 255, 255, 0.55)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
    label: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 15,
        letterSpacing: 0.2,
        marginLeft: 6,
    },
    labelOnDark: {
        textShadowColor: "rgba(0, 0, 0, 0.35)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

export default LanguageTrigger;
