type RefreshHandler = () => void;

let handler: RefreshHandler | null = null;

export const registerWalletSetupRefresh = (fn: RefreshHandler): (() => void) => {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
};

export const triggerWalletSetupRefresh = (): void => {
  handler?.();
};
