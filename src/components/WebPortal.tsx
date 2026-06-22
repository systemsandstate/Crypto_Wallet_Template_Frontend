import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { createPortal } from "react-dom";

type Props = {
    children: React.ReactNode;
};

/** Renders children into document.body on web (escapes overflow/stacking contexts). */
const WebPortal: React.FC<Props> = ({ children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (Platform.OS !== "web" || !mounted || typeof document === "undefined") {
        return null;
    }

    return createPortal(children, document.body);
};

export default WebPortal;
