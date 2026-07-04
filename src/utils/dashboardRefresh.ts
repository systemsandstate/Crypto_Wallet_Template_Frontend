type RefreshHandler = () => void;

let handler: RefreshHandler | null = null;

export const registerDashboardRefresh = (fn: RefreshHandler): (() => void) => {
    handler = fn;
    return () => {
        if (handler === fn) handler = null;
    };
};

export const triggerDashboardRefresh = (): void => {
    handler?.();
};
