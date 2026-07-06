import { blurActiveElement } from "./blurActiveElement";
import { dismissDialog, showDialog } from "./dialog";

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
    blurActiveElement();
    showDialog({
        title,
        message,
        buttons: [
            {
                text: cancelLabel,
                style: "cancel",
                onPress: () => dismissDialog(),
            },
            {
                text: confirmLabel,
                style: destructive ? "destructive" : "default",
                onPress: () => {
                    dismissDialog();
                    onConfirm();
                },
            },
        ],
    });
}
