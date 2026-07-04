import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useDispatch } from "react-redux";

import { AppLocale, getDictionary } from "../i18n";
import { setLocale } from "../store/localeSlice";
import store from "../store/store";

const subscribe = (onStoreChange: () => void) => store.subscribe(onStoreChange);
const getLocale = () => store.getState().locale.locale;

export function useTranslation() {
    const dispatch = useDispatch();
    const locale = useSyncExternalStore(subscribe, getLocale, getLocale);
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
