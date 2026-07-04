import { useEffect, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { getColors } from "../constants/theme";
import store from "../store/store";

const STYLE_ID = "merchant-web-input-styles";

const subscribe = (onStoreChange: () => void) => store.subscribe(onStoreChange);
const getIsDark = () => store.getState().theme.isDark;

function ensureStyleTag(): HTMLStyleElement | null {
    if (typeof document === "undefined") return null;
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    return el;
}

/**
 * Theme-aware web input CSS: kills Chrome autofill yellow/blue, keeps dark/light
 * fields consistent, and normalizes padding/outline across browsers.
 */
export function useWebInputStyles() {
    const isDark = useSyncExternalStore(subscribe, getIsDark, getIsDark);

    useEffect(() => {
        if (Platform.OS !== "web") return;

        const colors = getColors(isDark);
        const el = ensureStyleTag();
        if (!el) return;

        el.textContent = `
:root {
  --mp-input-bg: ${colors.white};
  --mp-input-text: ${colors.mainDark};
  --mp-input-placeholder: ${colors.placeholder};
  --mp-input-border: ${colors.inputBorder};
  --mp-surface: ${colors.white};
  --mp-bg: ${colors.bgColor};
}

/* RN Web text inputs */
input,
textarea {
  color: var(--mp-input-text) !important;
  caret-color: var(--mp-input-text);
  background-color: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  -webkit-appearance: none;
  appearance: none;
}

input::placeholder,
textarea::placeholder {
  color: var(--mp-input-placeholder) !important;
  opacity: 1;
}

/* Chrome / Safari / Edge autofill — force theme colors */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active {
  -webkit-text-fill-color: var(--mp-input-text) !important;
  caret-color: var(--mp-input-text) !important;
  box-shadow: 0 0 0 1000px var(--mp-input-bg) inset !important;
  -webkit-box-shadow: 0 0 0 1000px var(--mp-input-bg) inset !important;
  border: none !important;
  transition: background-color 99999s ease-out 0s;
  background-color: var(--mp-input-bg) !important;
}

/* Field shells used by InputField / forms */
[data-mp-input-shell="true"] {
  background-color: var(--mp-input-bg) !important;
  border-color: var(--mp-input-border) !important;
}

/* Avoid iOS/Safari zoom on focus (font-size < 16px) */
@media screen and (max-width: 768px) {
  input,
  textarea,
  select {
    font-size: 16px !important;
  }
}

/* Consistent focus ring on interactive controls */
button:focus-visible,
a:focus-visible {
  outline: 2px solid ${colors.accentBlue};
  outline-offset: 2px;
}
`;

        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
        document.body.style.backgroundColor = colors.bgColor;
    }, [isDark]);
}
