import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppLocale, getDictionary } from "../i18n";
import { setLocale } from "../store/localeSlice";
import type { RootState } from "../store/store";

export function useTranslation() {
    const dispatch = useDispatch();
    const locale = useSelector((state: RootState) => state.locale.locale);
    const dictionary = useMemo(() => getDictionary(locale), [locale]);

    const changeLocale = useCallback(
        (next: AppLocale) => {
            dispatch(setLocale(next));
        },
        [dispatch]
    );

    const dateLocale = locale === "es" ? "es-ES" : "en-US";

    return { t: dictionary, locale, dateLocale, setLocale: changeLocale };
}
