export type DialogButtonStyle = "cancel" | "destructive" | "default";

export type DialogButton = {
    text: string;
    style?: DialogButtonStyle;
    onPress?: () => void;
};

export type DialogPayload = {
    title: string;
    message?: string;
    buttons: DialogButton[];
};

type DialogListener = (payload: DialogPayload | null) => void;

const listeners = new Set<DialogListener>();

const emit = (payload: DialogPayload | null) => {
    listeners.forEach((listener) => listener(payload));
};

export const subscribeDialog = (listener: DialogListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export function showDialog(payload: DialogPayload): void {
    emit(payload);
}

export function dismissDialog(): void {
    emit(null);
}
