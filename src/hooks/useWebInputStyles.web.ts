import { useEffect } from "react";

const WEB_INPUT_STYLES = `
  input, textarea {
    outline: none !important;
    box-shadow: none !important;
  }
  input:focus, textarea:focus {
    outline: none !important;
    box-shadow: none !important;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    box-shadow: 0 0 0 1000px #ffffff inset !important;
    -webkit-text-fill-color: #1B1D4D !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

export function useWebInputStyles() {
    useEffect(() => {
        const id = "merchant-payments-input-styles";
        if (document.getElementById(id)) return;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = WEB_INPUT_STYLES;
        document.head.appendChild(style);
    }, []);
}
