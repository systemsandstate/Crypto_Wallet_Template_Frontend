export type ToastType = "success" | "error";

type ToastPayload = {
    message: string;
    type: ToastType;
};

type ToastListener = (payload: ToastPayload | null) => void;

const listeners = new Set<ToastListener>();
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const emit = (payload: ToastPayload | null) => {
    listeners.forEach((listener) => listener(payload));
};

export const subscribeToast = (listener: ToastListener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const showToast = (
    message: string,
    type: ToastType = "success",
    durationMs = 2500
): void => {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    emit({ message, type });
    hideTimer = setTimeout(() => {
        emit(null);
        hideTimer = null;
    }, durationMs);
};
