import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../constants";
import { AppLocale, LOCALES } from "../i18n";
import LocaleFlag from "../components/LocaleFlag";
import WebPortal from "../components/WebPortal";
import { useTranslation } from "../hooks/useTranslation";
import { blurActiveElement } from "../utils/blurActiveElement";

const ACCENT_BLUE = "#5B8DEF";
const IS_WEB = Platform.OS === "web";

type LanguagePickerContextValue = {
    openPicker: () => void;
};

const LanguagePickerContext = createContext<LanguagePickerContextValue | null>(null);

export function useLanguagePicker() {
    const ctx = useContext(LanguagePickerContext);
    if (!ctx) {
        throw new Error("useLanguagePicker must be used within LanguagePickerProvider");
    }
    return ctx;
}

type SheetProps = {
    locale: AppLocale;
    options: AppLocale[];
    paddingBottom: number;
    onClose: () => void;
    onSelect: (locale: AppLocale) => void;
    title: string;
    spanishLabel: string;
    englishLabel: string;
    cancelLabel: string;
};

const LanguagePickerSheet: React.FC<SheetProps> = ({
    locale,
    options,
    paddingBottom,
    onClose,
    onSelect,
    title,
    spanishLabel,
    englishLabel,
    cancelLabel,
}) => (
    <View
        style={[
            styles.bottomSheet,
            IS_WEB && styles.bottomSheetWeb,
            { paddingBottom },
        ]}
    >
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
            <Text style={styles.sheetHeaderTitle}>{title}</Text>
            <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
            >
                <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.optionsList}>
            {options.map((code, index) => {
                const selected = code === locale;
                const label = code === "es" ? spanishLabel : englishLabel;
                return (
                    <TouchableOpacity
                        key={code}
                        style={[
                            styles.optionRow,
                            index < options.length - 1 && styles.optionRowBorder,
                            selected && styles.optionRowSelected,
                        ]}
                        onPress={() => onSelect(code)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                    >
                        <View style={styles.optionLeft}>
                            <LocaleFlag locale={code} size={24} />
                            <Text
                                style={[
                                    styles.optionLabel,
                                    selected && styles.optionLabelSelected,
                                ]}
                            >
                                {label}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.optionCode,
                                selected && styles.optionCodeSelected,
                            ]}
                        >
                            {LOCALES[code].label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>

        <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
        </TouchableOpacity>
    </View>
);

const LanguagePickerOverlay: React.FC<SheetProps> = (sheetProps) => (
    <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable
            style={styles.flexBackdrop}
            onPress={sheetProps.onClose}
            accessibilityLabel={sheetProps.cancelLabel}
        />
        <LanguagePickerSheet {...sheetProps} />
    </View>
);

export const LanguagePickerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const insets = useSafeAreaInsets();
    const { t, locale, setLocale } = useTranslation();
    const [open, setOpen] = useState(false);

    const options: AppLocale[] = ["es", "en"];
    const sheetPaddingBottom = Math.max(insets.bottom, 16) + 8;

    const close = useCallback(() => {
        blurActiveElement();
        setOpen(false);
    }, []);

    const openPicker = useCallback(() => {
        blurActiveElement();
        setOpen(true);
    }, []);

    const selectLocale = useCallback(
        (next: AppLocale) => {
            setLocale(next);
            close();
        },
        [close, setLocale]
    );

    useEffect(() => {
        if (!open || !IS_WEB) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, close]);

    useEffect(() => {
        if (!open || !IS_WEB || typeof document === "undefined") return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const pickerValue = useMemo(() => ({ openPicker }), [openPicker]);

    const sheetProps: SheetProps = {
        locale,
        options,
        paddingBottom: sheetPaddingBottom,
        onClose: close,
        onSelect: selectLocale,
        title: t.language.title,
        spanishLabel: t.language.spanish,
        englishLabel: t.language.english,
        cancelLabel: t.common.cancel,
    };

    const overlay = <LanguagePickerOverlay {...sheetProps} />;

    return (
        <LanguagePickerContext.Provider value={pickerValue}>
            {children}
            {open && IS_WEB ? <WebPortal>{overlay}</WebPortal> : null}
            {open && !IS_WEB ? (
                <Modal
                    visible
                    transparent
                    animationType="slide"
                    statusBarTranslucent
                    onRequestClose={close}
                >
                    {overlay}
                </Modal>
            ) : null}
        </LanguagePickerContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        ...(IS_WEB
            ? ({
                  position: "fixed",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  zIndex: 100000,
                  display: "flex",
                  flexDirection: "column",
              } as object)
            : {
                  flex: 1,
                  flexDirection: "column",
              }),
    },
    flexBackdrop: {
        flex: 1,
        width: "100%",
    },
    bottomSheet: {
        backgroundColor: theme.COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        paddingHorizontal: 20,
        width: "100%",
        ...(IS_WEB
            ? ({
                  position: "relative",
                  zIndex: 1,
                  flexShrink: 0,
              } as object)
            : {}),
    },
    bottomSheetWeb: {
        maxWidth: 560,
        alignSelf: "center",
        ...(IS_WEB
            ? ({
                  boxShadow: "0 -8px 32px rgba(6, 38, 100, 0.12)",
              } as object)
            : {}),
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#D8DEE8",
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    sheetHeaderTitle: {
        ...theme.FONTS.H5,
        color: theme.COLORS.mainDark,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#EEF1F5",
        alignItems: "center",
        justifyContent: "center",
    },
    closeButtonText: {
        fontSize: 22,
        lineHeight: 24,
        color: theme.COLORS.bodyTextColor,
        marginTop: -2,
    },
    optionsList: {
        marginBottom: 12,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E2E8F0",
    },
    optionRowSelected: {
        backgroundColor: "#F4F7FF",
        marginHorizontal: -4,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    optionLabel: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 16,
        color: theme.COLORS.mainDark,
        marginLeft: 12,
    },
    optionLabelSelected: {
        color: ACCENT_BLUE,
    },
    optionCode: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 13,
        color: theme.COLORS.bodyTextColor,
    },
    optionCodeSelected: {
        color: ACCENT_BLUE,
    },
    cancelRow: {
        alignItems: "center",
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#E2E8F0",
    },
    cancelText: {
        ...theme.FONTS.Mulish_600SemiBold,
        fontSize: 16,
        color: theme.COLORS.bodyTextColor,
    },
});
