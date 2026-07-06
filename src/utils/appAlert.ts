import { blurActiveElement } from "./blurActiveElement";
import { dismissDialog, showDialog, type DialogButton } from "./dialog";

type AlertButton = {
    text: string;
    style?: DialogButton["style"];
    onPress?: () => void;
};

/** Themed alert dialog — same UX on web and native (replaces Alert.alert / window.confirm). */
export const appAlert = {
    alert(title: string, message?: string, buttons?: AlertButton[]): void {
        blurActiveElement();

        const mapped =
            buttons && buttons.length > 0
                ? buttons.map((button) => ({
                      text: button.text,
                      style: button.style,
                      onPress: () => {
                          dismissDialog();
                          button.onPress?.();
                      },
                  }))
                : [{ text: "OK", onPress: () => dismissDialog() }];

        showDialog({
            title,
            message,
            buttons: mapped,
        });
    },
};
