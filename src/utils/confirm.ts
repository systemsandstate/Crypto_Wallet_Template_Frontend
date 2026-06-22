import { Alert, Platform } from "react-native";

import { blurActiveElement } from "./blurActiveElement";

type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
};

export function confirmAction({
    title,
    message,
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    destructive = false,
    onConfirm,
}: ConfirmOptions) {
    if (Platform.OS === "web") {
        blurActiveElement();
        if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
        return;
    }

    Alert.alert(title, message, [
        { text: cancelLabel, style: "cancel" },
        {
            text: confirmLabel,
            style: destructive ? "destructive" : "default",
            onPress: onConfirm,
        },
    ]);
}
