import type { AppLocale, TranslationDict } from "./types";
import es from "./locales/es";
import en from "./locales/en";

export const DEFAULT_LOCALE: AppLocale = "es";

export const LOCALES: Record<AppLocale, { label: string; nativeLabel: string }> = {
    es: { label: "ES", nativeLabel: "Español" },
    en: { label: "EN", nativeLabel: "English" },
};

const dictionaries: Record<AppLocale, TranslationDict> = { es, en };

export function getDictionary(locale: AppLocale): TranslationDict {
    return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export type { AppLocale, TranslationDict };
